import {Router} from "express";
import userMgr from '../../models/userMgr';
import apiResponseBase from "../../models/dataStruct/apiResponseUserBase";
import {apiError} from "../../models/dataStruct/response/baseResponse";

const router = Router()


router.post('/register', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {username, password, deviceId} = req.body;
        response.result = await userMgr.register(username, password, deviceId);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/login', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {username, password, deviceId} = req.body;
        response.result = await userMgr.loginByDevice(username, password, deviceId);
        req.session.userId = response.result.userId;
        req.session.accessKey = response.result.accessKey;
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/add_fcm_token', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, deviceId, fcmToken} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.addFcmToken(userId, deviceId, fcmToken);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/logout', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, deviceId} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.logoutByDevice(userId, deviceId);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/delete_account', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.deleteAccount(userId);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/get_image', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.getImage(userId);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/set_image', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, userImage} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.setImage(userId, userImage);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/set_password', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, password} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.setPassword(userId, password);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/push_favorite', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, favoriteList} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.pushFavorite(userId, favoriteList);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/pull_favorite', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, favoriteIdList} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.pullFavorite(userId, favoriteIdList);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/get_favorite', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.getFavorite(userId);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/push_black_list', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, placeIdList} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.pushBlackList(userId, placeIdList);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/pull_black_list', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey, placeIdList} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.pullBlackList(userId, placeIdList);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

router.post('/get_black_list', async function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    try {
        let {userId, accessKey} = req.body;
        await response.verifyUser(userId, accessKey);
        response.result = await userMgr.getBlackList(userId);
    } catch (error: apiError | any) {
        response.errorHandle(error);
    }
    return res.send(response);
});

export default router;
