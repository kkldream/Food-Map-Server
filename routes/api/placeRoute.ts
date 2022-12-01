import {Router} from "express";
import placeMgr from '../../models/placeMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";
import googleMapsMgr from "../../models/googleMapsMgr";

const router = Router()

router.post('/search_by_distance', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, latitude, longitude, distance, minNum, maxNum} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.searchByDistance(latitude, longitude, distance, minNum, maxNum);
    } catch (error: any) {
        if (error.status) response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

router.post('/search_by_keyword', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, latitude, longitude, keyword, minNum, maxNum} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.searchByKeyword(latitude, longitude, keyword, minNum, maxNum);
    } catch (error: any) {
        if (error.status) response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

router.post('/details_by_place_id', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, place_id} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await googleMapsMgr.detailsByPlaceId(place_id);
    } catch (error: any) {
        if (error.status) response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

router.post('/draw_card', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, latitude, longitude, mode, num} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await placeMgr.drawCard(userId, latitude, longitude, mode, num);
    } catch (error: any) {
        if (error.status) response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

export default router;