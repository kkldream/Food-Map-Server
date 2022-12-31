import {Router} from "express";
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";
import {apiError} from "../../models/dataStruct/response/baseResponse";
import rootMgr from "../../models/rootMgr";
import placeMgr from "../../models/placeMgr";

const router = Router()

router.post('/push_black_list', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase(req);
    try {
        await response.verifyRoot();
        let {placeIdList} = req.body;
        response.result = await rootMgr.pushBlackList(placeIdList);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/pull_black_list', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase(req);
    try {
        await response.verifyRoot();
        let {placeIdList} = req.body;
        response.result = await rootMgr.pullBlackList(placeIdList);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/get_black_list', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase(req);
    try {
        await response.verifyRoot();
        response.result = await rootMgr.getBlackList();
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/push_url_photo', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase(req);
    try {
        await response.verifyRoot();
        let {url} = req.body;
        response.result = await rootMgr.pushUrlPhoto(url);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/get_photo', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase(req);
    try {
        await response.verifyRoot();
        let {photoId, detail} = req.body;
        response.result = await placeMgr.getPhoto(photoId, detail);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

export default router;
