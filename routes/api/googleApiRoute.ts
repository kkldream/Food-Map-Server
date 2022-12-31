import {Router} from "express";
import googleMapsMgr from '../../models/googleMapsMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";
import {apiError} from "../../models/dataStruct/response/baseResponse";

const router = Router()

router.post('/update_custom', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase(req);
    try {
        await response.verifyRoot();
        let {location, distance, keyword} = req.body;
        response.result = await googleMapsMgr.updateCustom(location, distance, keyword);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/update_place_by_distance', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase(req);
    try {
        await response.verifyRoot();
        let {location, searchPageNum} = req.body;
        response.result = await googleMapsMgr.updatePlaceByDistance(location, searchPageNum);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

export default router;
