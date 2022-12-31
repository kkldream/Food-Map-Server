import {Router} from 'express';
import apiResponseBase from '../models/dataStruct/apiResponseUserBase';
import placeRoute from './api/placeRoute';
import geocodeRoute from './api/geocodeRoute';
import googleApiRoute from './api/googleApiRoute';
import userRoute from './api/userRoute';
import rootRoute from "./api/rootRoute";
import {routeApiLogDocument} from "../models/dataStruct/mongodb/routeApiLogDocument";
import {baseResponses} from "../models/dataStruct/response/baseResponse";

const router = Router();

router.use(function (req: any, res: any, next: any) {
    req.requestTime = new Date();
    next();
});

// 實作express.json()方法，改善在json body裡放註解不會抱錯
router.use(async function (req: any, res: any, next: any) {
    let buffers = [];
    for await (let chunk of req) buffers.push(chunk);
    let dataStr = Buffer.concat(buffers).toString();
    // 字串處理
    let output = "";
    let slashToken = false;
    let doubleQuotesToken = false;
    let isAnnotationStatus = false;
    for (let index = 0; index < dataStr.length; index++) {
        let data = dataStr[index];
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
});

router.use(function (req: any, res: any, next: any) {
    if (req.session.userId) req.body.userId = req.session.userId;
    if (req.session.accessKey) req.body.accessKey = req.session.accessKey;
    next();
});

router.use(function (req: any, res: any, next: any) {
    const routeApiLogCol = global.mongodbClient.foodMapDb.routeApiLogCol;
    let routeApiLogDoc: routeApiLogDocument = {
        createTime: new Date(),
        method: req.method,
        apiUrl: req.originalUrl,
        apiUrlPath: req.originalUrl.split("/").splice(2),
        request: {}
    };
    if (req.body.userId) routeApiLogDoc.userId = req.body.userId;
    if (Object.keys(req.params).length !== 0) routeApiLogDoc.request.params = req.params;
    if (Object.keys(req.query).length !== 0) routeApiLogDoc.request.query = req.query;
    if (Object.keys(req.body).length !== 0) routeApiLogDoc.request.body = req.body;
    routeApiLogCol.insertOne(routeApiLogDoc);
    next();
});

router.use('/place', placeRoute);
router.use('/geocode', geocodeRoute);
router.use('/google_api', googleApiRoute);
router.use('/user', userRoute);
router.use('/root', rootRoute);

router.get('/', function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    response.status = 0;
    response.result = {msg: 'api is ready'};
    res.send(response);
});

router.use(function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    response.status = -1;
    response.errorHandle(new Error(`Not found '${req.url}' api`));
    res.send(response);
});

export default router;
