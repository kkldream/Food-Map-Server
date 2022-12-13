import {Router} from "express";
import placeMgr from '../../models/placeMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";
import googleMapsMgr from "../../models/googleMapsMgr";
import {apiError} from "../../models/dataStruct/response/baseResponse";

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

export default router;
