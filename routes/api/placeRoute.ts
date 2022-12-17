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

router.post('/get_photo', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, photoId, detail} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.getPhoto(photoId, detail);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.get('/get_html_photo/:photoId', async function (req: any, res: any, next: any) {
    try {
        let photoId = req.params.photoId;
        let base64Img = await placeMgr.getHtmlPhoto(photoId);
        return res.render('photo', {base64Img});
    } catch (error: apiError | any) {
        let base64Img = await placeMgr.getHtmlPhoto(config.image.defaultId);
        return res.render('photo', {base64Img});
    }
});

export default router;
