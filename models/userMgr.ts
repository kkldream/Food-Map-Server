import {ObjectId} from 'mongodb';
import utils from './utils';
import {errorCodes, throwError} from "./dataStruct/throwError";

async function register(username: string, password: string, deviceId: string) {
    if (!username || !password || !deviceId) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const loginLogCol = global.mongodbClient.foodMapDb.loginLogCol;

    let userDoc = await userCol.findOne({username});
    if (userDoc) throwError(errorCodes.accountRegistered);

    // insert user document
    let accessKey = utils.generateUUID();
    let insertResult = await userCol.insertOne({
        createTime: new Date(),
        updateTime: new Date(),
        username, password, accessKey,
        userImage: "",
        devices: [{deviceId, fcmToken: "", isUse: true}]
    });

    // insert login log
    await loginLogCol.insertOne({
        userId: insertResult.insertedId,
        username,
        deviceId,
        createTime: new Date(),
        status: 'signin'
    });

    // response
    return {
        msg: '註冊成功',
        userId: insertResult.insertedId,
        accessKey
    };
}

async function loginByDevice(username: string, password: string, deviceId: string) {
    if (!username || !password || !deviceId) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const loginLogCol = global.mongodbClient.foodMapDb.loginLogCol;
    let userDoc = await userCol.findOne({username});
    if (!userDoc) throwError(errorCodes.accountNotFound);
    if (password !== userDoc.password) throwError(errorCodes.accountPasswordError);
    // insert login log
    await loginLogCol.insertOne({
        userId: userDoc._id,
        username,
        deviceId,
        createTime: new Date(),
        status: 'login'
    });
    // update user document
    let deviceDoc = userDoc.devices.find((item: any) => item.deviceId === deviceId);
    if (deviceDoc) {
        await userCol.updateOne(
            {_id: new ObjectId(userDoc._id)},
            {$set: {"devices.$[item].isUse": true}},
            {arrayFilters: [{"item.deviceId": deviceId}]}
        );
    } else {
        await userCol.updateOne(
            {_id: new ObjectId(userDoc._id)},
            {$push: {devices: {deviceId, fcmToken: "", isUse: true}}}
        );
    }
    // response
    return {
        msg: '登入成功',
        userId: userDoc._id,
        accessKey: userDoc.accessKey
    };
}

async function addFcmToken(userId: string, deviceId: string, fcmToken: string) {
    if (!deviceId || !fcmToken) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc = await userCol.findOne({_id: new ObjectId(userId)});
    let deviceDoc = userDoc.devices.find((item: any) => item.deviceId === deviceId);
    if (!deviceDoc) throwError(errorCodes.loginDeviceNotFound);
    if (deviceDoc.fcmToken === fcmToken)
        return {msg: '已存在相同fcmToken'};
    await userCol.updateOne(
        {_id: new ObjectId(userId)},
        {$set: {"devices.$[item].fcmToken": fcmToken}},
        {arrayFilters: [{"item.deviceId": deviceId}]}
    );
    return {msg: '已更新舊fcmToken'};
}

async function logoutByDevice(userId: string, deviceId: string) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const loginLogCol = global.mongodbClient.foodMapDb.loginLogCol;
    let userDoc = await userCol.findOne({_id: new ObjectId(userId)});
    if (!userDoc.devices.find((doc: any) => doc.deviceId === deviceId && doc.isUse === true))
        throwError(errorCodes.loginDeviceNotFound);
    // insert logout log
    await loginLogCol.insertOne({
        userId,
        username: userDoc.username,
        deviceId,
        createTime: new Date(),
        status: 'logout'
    });
    // update user document
    await userCol.updateOne(
        {_id: new ObjectId(userId)},
        {$set: {"devices.$[item].isUse": false}},
        {arrayFilters: [{"item.deviceId": deviceId}]}
    );
    return {msg: '登出成功'};
}

async function deleteAccount(userId: string) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const loginLogCol = global.mongodbClient.foodMapDb.loginLogCol;
    await loginLogCol.updateMany({_id: new ObjectId(userId), isUse: true}, {$set: {isUse: false}});
    await userCol.deleteMany({_id: new ObjectId(userId)})
    return {msg: '刪除帳號成功'};
}

async function getImage(userId: string) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc = await userCol.findOne({_id: new ObjectId(userId)});
    return {userImage: userDoc.userImage || ''};
}

async function setImage(userId: string, userImage: string) {
    if (!userImage) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let updateResult = await userCol.updateOne({_id: new ObjectId(userId)}, {$set: {userImage}})
    if (updateResult.modifiedCount > 0) return {msg: '已更新使用者圖片'};
    else return {msg: '已存在相同的使用者圖片'};
}

async function setPassword(userId: string, password: string) {
    if (!password) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    await userCol.updateOne({_id: new ObjectId(userId)}, {$set: {password}})
    return {msg: '已更新使用者密碼'};
}

export default {
    register,
    loginByDevice,
    deleteAccount,
    getImage,
    setImage,
    setPassword,
    addFcmToken,
    logoutByDevice
};
