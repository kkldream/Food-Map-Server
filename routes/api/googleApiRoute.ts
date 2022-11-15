import { Router } from "express";
import googleMapsMgr from '../../models/googleMapsMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";

const router = Router()

router.post('/update', async function(req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { accessKey, latitude, longitude, radius } = req.body;
        await response.verifyRoot(accessKey);
        response.result = await googleMapsMgr.updateRestaurant(latitude, longitude, radius);
    } catch (error: any) {
        if (error.status) response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

export default router;
