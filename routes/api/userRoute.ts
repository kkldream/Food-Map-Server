import { Router } from "express";
import userMgr from '../../models/userMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";

const router = Router()

router.post('/register', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { username, password, deviceId } = req.body;
        response.result = await userMgr.register(username, password, deviceId);
    } catch (error: any) {
        response.status = error.status || -1;
        response.errMsg = error.msg || '未知錯誤';
    }
    res.send(response);
});

router.post('/login', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { username, password, deviceId } = req.body;
        response.result = await userMgr.loginByDevice(username, password, deviceId);
    } catch (error: any) {
        response.status = error.status || -1;
        response.errMsg = error.msg || '未知錯誤';
    }
    res.send(response);
});

router.post('/add_fcm_token', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { userId, accessKey, deviceId, fcmToken } = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.addFcmToken(userId, deviceId, fcmToken);
    } catch (error: any) {
        response.status = error.status || -1;
        response.errMsg = error.msg || '未知錯誤';
    }
    res.send(response);
});

router.post('/logout', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { userId, accessKey, deviceId } = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.logoutByDevice(userId, deviceId);
    } catch (error: any) {
        response.status = error.status || -1;
        response.errMsg = error.msg || '未知錯誤';
    }
    res.send(response);
});

router.post('/delete_account', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { userId, accessKey } = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.deleteAccount(userId);
    } catch (error: any) {
        response.status = error.status || -1;
        response.errMsg = error.msg || '未知錯誤';
    }
    res.send(response);
});

router.post('/get_image', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { userId, accessKey } = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.getImage(userId);
    } catch (error: any) {
        response.status = error.status || -1;
        response.errMsg = error.msg || '未知錯誤';
    }
    res.send(response);
});

router.post('/set_image', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { userId, accessKey, userImage } = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.setImage(userId, userImage);
    } catch (error: any) {
        response.status = error.status || -1;
        response.errMsg = error.msg || '未知錯誤';
    }
    res.send(response);
});

router.post('/set_password', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let { userId, accessKey, password } = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.setPassword(userId, password);
    } catch (error: any) {
        response.status = error.status || -1;
        response.errMsg = error.msg || '未知錯誤';
    }
    res.send(response);
});

export default router;
