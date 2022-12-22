import {Router} from "express";
import placeMgr from '../../models/placeMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";
import googleMapsMgr from "../../models/googleMapsMgr";
import {apiError} from "../../models/dataStruct/response/baseResponse";
import config from "../../config";

const router = Router()

router.post('/search_by_distance', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, latitude, longitude, distance, skip, limit} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.searchByDistance(userId, latitude, longitude, distance, skip, limit);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/search_by_keyword', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, latitude, longitude, keyword, skip, limit} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.searchByKeyword(userId, latitude, longitude, keyword, skip, limit);
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
        response.result = await googleMapsMgr.detailsByPlaceId(userId, place_id);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/draw_card', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, latitude, longitude, mode, num} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.drawCard(userId, latitude, longitude, mode, num);
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
        let {userId, accessKey, latitude, longitude, input, radius} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.autocomplete(userId, latitude, longitude, input, radius);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

export default router;
