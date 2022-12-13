import {Router} from "express";
import googleMapsMgr from '../../models/googleMapsMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";
import {apiError} from "../../models/dataStruct/response/baseResponse";

const router = Router()

router.post('/update_custom', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {accessKey, latitude, longitude, radius, keyword} = req.body;
        await response.verifyRoot(accessKey);
        response.result = await googleMapsMgr.updateCustom(latitude, longitude, radius, keyword);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/update_place_by_distance', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {accessKey, latitude, longitude, searchPageNum} = req.body;
        await response.verifyRoot(accessKey);
        response.result = await googleMapsMgr.updatePlaceByDistance(latitude, longitude, searchPageNum);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

export default router;
