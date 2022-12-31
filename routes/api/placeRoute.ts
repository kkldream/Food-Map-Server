import {Router} from "express";
import placeMgr from '../../models/placeMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";
import {apiError} from "../../models/dataStruct/response/baseResponse";
import config from "../../config";

const router = Router()

router.post('/search_by_distance', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase(req);
    try {
        let {userId, location, distance, skip, limit} = req.body;
        await response.verifyUser();
        response.result = await placeMgr.searchByDistance(userId, location, distance, skip, limit);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/search_by_keyword', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, location, distance, keyword, skip, limit} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.searchByKeyword(userId, location, distance, keyword, skip, limit);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/details_by_place_id', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, place_id} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.detailsByPlaceId(userId, place_id);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/draw_card', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, location, mode, num} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.drawCard(userId, location, mode, num);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.get('/get_html_photo/:photoId', async function (req: any, res: any, next: any) {
    res.setHeader('Content-Type', 'image/jpeg');
    try {
        // let userId = req.query.userId;
        let photoId = req.params.photoId;
        let base64Img = await placeMgr.getHtmlPhoto(photoId);
        let buff = Buffer.from(base64Img, 'base64');
        return res.send(buff);
    } catch (error: apiError | any) {
        let base64Img = await placeMgr.getHtmlPhoto(config.image.defaultId);
        let buff = Buffer.from(base64Img, 'base64');
        return res.send(buff);
    }
});

router.post('/autocomplete', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, location, input, distance, deepSearch} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.autocomplete(location, input, distance, deepSearch);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

export default router;
