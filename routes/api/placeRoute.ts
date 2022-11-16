import {Router} from "express";
import restaurantMgr from '../../models/placeMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";

const router = Router()

router.post('/search_by_distance', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, latitude, longitude, distance, minNum, maxNum} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await restaurantMgr.searchByDistance(latitude, longitude, distance, minNum, maxNum);
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
        response.result = await restaurantMgr.searchByKeyword(latitude, longitude, keyword, minNum, maxNum);
    } catch (error: any) {
        if (error.status) response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

export default router;
