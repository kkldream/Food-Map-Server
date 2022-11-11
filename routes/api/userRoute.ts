import { Router } from "express";
import userMgr from '../../models/userMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";

const router = Router()

router.post('/register', async function(req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { username, password } = req.body;
        response.result = await userMgr.register(username, password);
        response.status = 0;
    } catch (error: any) {
        response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

router.post('/login', async function(req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { username, password, deviceId } = req.body;
        response.result = await userMgr.login(username, password, deviceId);
        response.status = 0;
    } catch (error: any) {
        response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

router.post('/delete_account', async function(req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { username, accessKey } = req.body;
        await response.verifyUser(username, accessKey);
        response.result = await userMgr.deleteAccount(username);
    } catch (error: any) {
        if (error.status) response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

router.post('/action', async function(req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { username, accessKey } = req.body;
        await response.verifyUser(username, accessKey);
        response.result = await userMgr.action(username);
    } catch (error: any) {
        if (error.status) response.status = error.status;
        response.errMsg = error.msg;
    }
    res.send(response);
});

module.exports = router;
