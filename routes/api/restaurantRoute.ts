import { Router } from "express";
import restaurantMgr from '../../models/restaurantMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";

const router = Router()

router.post('/search_by_near', async function(req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { userId, accessKey, latitude, longitude, radius } = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await restaurantMgr.searchByLocation(latitude, longitude, radius);
    } catch (error: any) {
        if (error.status) response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

router.post('/search_by_name', async function(req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { userId, accessKey, name } = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await restaurantMgr.searchByName(name);
    } catch (error: any) {
        if (error.status) response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

export default router;
