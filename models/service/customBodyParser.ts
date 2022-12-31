import {baseResponses} from "../dataStruct/response/baseResponse";

/**
 * 實作express.json()方法，改善在json body裡放註解不會抱錯
 * @param req
 * @param res
 * @param next
 */
export async function customBodyParser(req: any, res: any, next: any) {
    if (req.headers["content-type"] !== "application/json") {
        req.body = {};
        return next();
    }
    let buffers = [];
    for await (let chunk of req) buffers.push(chunk);
    let dataStr = Buffer.concat(buffers).toString();
    // 方法轉換
    let output = method_1(dataStr);
    output = method_2(output);
    // json轉換
    try {
        req.body = JSON.parse(output);
        next();
    } catch (err) {
        res.send(({
            requestTime: req.requestTime,
            status: -1,
            errMsg: "JSON解析錯誤"
        } as baseResponses));
    }
}

/**
 * 允許雙斜線("//")註解
 * @param input
 */
function method_1(input: string): string {
    let output = "";
    let slashToken = false;
    let doubleQuotesToken = false;
    let isAnnotationStatus = false;
    for (let index = 0; index < input.length; index++) {
        let data = input[index];
        if (data === "/") slashToken = !slashToken;
        if (data === "\"") doubleQuotesToken = !doubleQuotesToken;
        if (!doubleQuotesToken && data === " ") continue;
        if (!doubleQuotesToken && data === "/") {
            isAnnotationStatus = true;
            continue;
        }
        if (isAnnotationStatus && (data === "\r" || data === "\n")) {
            isAnnotationStatus = false;
            continue;
        }
        if (!isAnnotationStatus) output += data;
    }
    return output;
}

/**
 * 允許最後項多逗號(",")
 * @param input
 */
function method_2(input: string): string {
    let output = input.split("").reduce((previousValue: string, currentValue: string): string => {
        if (["\n", "\r", " "].includes(currentValue)) return previousValue;
        return previousValue + currentValue;
    }, "");
    output = output.split("}").map(str => {
        let splitList = str.split("");
        if (splitList.slice(-1)[0] === ",")
            return splitList.slice(0, splitList.length - 1).join("");
        return str;
    }).join("}");
    return output;
}