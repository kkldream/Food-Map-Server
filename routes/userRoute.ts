import { Router } from "express";
const userMgr = require('../models/userMgr');
const apiResponseBase = require('../models/dataStruct/apiResponseBase');
const router = Router()

router.post('/register', async function(req: any, res: any, next: any) {
    let response = apiResponseBase();
    try {
        let { username, password } = req.body;
        response.result = await userMgr.register(username, password);
    } catch (error: any) {
        response.status = -1;
        response.errMsg = error;
    }
    res.send(response);
});

router.post('/login', async function(req: any, res: any, next: any) {
    let response = apiResponseBase();
    try {
        let { username, password, deviceId } = req.body;
        response.result = await userMgr.login(username, password, deviceId);
    } catch (error: any) {
        response.status = -1;
        response.errMsg = error;
    }
    res.send(response);
});

router.post('/delete_account', async function(req: any, res: any, next: any) {
    let response = apiResponseBase();
    try {
        let { username, accessKey } = req.body;
        response.result = await userMgr.deleteAccount(username, accessKey);
    } catch (error: any) {
        response.status = -1;
        response.errMsg = error;
    }
    res.send(response);
});

module.exports = router;
