import {Router} from "express";
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";
import {apiError} from "../../models/dataStruct/response/baseResponse";
import geocodeMgr from "../../models/geocodeMgr";

const router = Router()

router.post('/autocomplete', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase(req);
    try {
        await response.verifyUser();
        let {location, input} = req.body;
        response.result = await geocodeMgr.autocomplete(location, input);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/get_location_by_address', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase(req);
    try {
        await response.verifyUser();
        let {address} = req.body;
        response.result = await geocodeMgr.getLocationByAddress(address);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

export default router;
