import dotenv from 'dotenv';
import {ObjectId} from 'mongodb';
import {errorCodes, throwError} from "./throwError";
import {apiError, baseResponses, msgItem} from "./response/baseResponse";

dotenv.config();

interface apiResponseBaseInterface extends baseResponses{
    verifyRoot(accessKey: string): Promise<msgItem>;
    verifyUser(userId: string, accessKey: string): Promise<msgItem>;
}

export default class apiResponseBase implements apiResponseBaseInterface {
    requestTime: Date;
    verify?: boolean;
    status: number;
    errMsg?: apiError;
    result?: any;

    constructor() {
        this.requestTime = new Date();
        this.verify = undefined;
        this.status = 0;
    }

    errorHandle(error: apiError | any): void {
        this.status = error.status ? error.status : -1;
        this.errMsg = error.status ? error.text : {name: error.name, message: error.message, stack: error.stack};
    }

    async verifyRoot(accessKey: string): Promise<msgItem> {
        if (accessKey !== process.env.ROOT_ACCESS_KEY) {
            this.verify = false;
            this.status = 4;
            throw throwError(errorCodes.accessKeyVerifyError);
        }
        this.status = 0;
        this.verify = true;
        return {msg: '驗證成功'};
    }

    async verifyUser(userId: string, accessKey: string): Promise<msgItem> {
        let userDoc = await global.mongodbClient.foodMapDb.userCol.findOne({_id: new ObjectId(userId)});
        if (!userDoc) {
            this.verify = false;
            this.status = 3;
            throwError(errorCodes.accountNotFound);
        }
        if (userDoc.accessKey !== accessKey) {
            this.verify = false;
            this.status = 4;
            throwError(errorCodes.accessKeyVerifyError);
        }
        this.verify = true;
        this.status = 0;
        return {msg: '驗證成功'};
    }
}
