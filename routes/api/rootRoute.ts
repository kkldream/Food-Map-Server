import {Router} from "express";
import googleMapsMgr from '../../models/googleMapsMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";
import {apiError} from "../../models/dataStruct/response/baseResponse";
import rootMgr from "../../models/rootMgr";

const router = Router()

router.post('/push_black_list', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {accessKey, place_id} = req.body;
        await response.verifyRoot(accessKey);
        response.result = await rootMgr.pushBlackList(place_id);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/pull_black_list', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {accessKey, place_id} = req.body;
        await response.verifyRoot(accessKey);
        response.result = await rootMgr.pullBlackList(place_id);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

export default router;
