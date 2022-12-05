import {ObjectId} from 'mongodb';
import utils from './utils';
import {errorCodes, isUndefined, throwError} from "./dataStruct/throwError";
import userDocument, {favoriteItem} from "./dataStruct/mongodb/userDocument";
import {locationItem} from "./dataStruct/mongodb/placeDocument";

async function register(username: string, password: string, deviceId: string) {
    if (isUndefined([username, password, deviceId])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const loginLogCol = global.mongodbClient.foodMapDb.loginLogCol;

    let userDoc = await userCol.findOne({username});
    if (userDoc) throwError(errorCodes.accountRegistered);

    // insert user document
    let accessKey = utils.generateUUID();
    let insertDoc: userDocument = {
        createTime: new Date(),
        updateTime: new Date(),
        username, password, accessKey,
        userImage: "",
        devices: [{deviceId, fcmToken: "", isUse: true}],
        favoriteList: []
    };
    let insertResult = await userCol.insertOne(insertDoc);

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
    if (isUndefined([username, password, deviceId])) throwError(errorCodes.requestDataError);
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
    if (isUndefined([deviceId, fcmToken])) throwError(errorCodes.requestDataError);
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
    if (isUndefined([userImage])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let updateResult = await userCol.updateOne({_id: new ObjectId(userId)}, {$set: {userImage}})
    if (updateResult.modifiedCount > 0) return {msg: '已更新使用者圖片'};
    else return {msg: '已存在相同的使用者圖片'};
}

async function setPassword(userId: string, password: string) {
    if (isUndefined([password])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    await userCol.updateOne({_id: new ObjectId(userId)}, {$set: {password}})
    return {msg: '已更新使用者密碼'};
}

async function pushFavorite(userId: string, favoriteList: favoriteItem[]) {
    if (isUndefined([favoriteList])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    let favoriteIdList = favoriteList.map(e => e.placeId);
    let oldFavoriteList = userDoc.favoriteList ? userDoc.favoriteList.filter(e => !favoriteIdList.includes(e.placeId)) : [];
    let newFavoriteList = favoriteList.map(e => {
        e.updateTime = new Date();
        return e;
    });
    let outFavoriteList = oldFavoriteList.concat(newFavoriteList);
    await userCol.updateOne({_id: new ObjectId(userId)}, {$set: {favoriteList: outFavoriteList}});
    return {msg: '添加最愛成功'};
}

async function pullFavorite(userId: string, favoriteIdList: string[]) {
    if (isUndefined([favoriteIdList])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    if (!userDoc.favoriteList) return {msg: '無最愛紀錄'};
    let outFavoriteList = userDoc.favoriteList.filter(e => !favoriteIdList.includes(e.placeId));
    await userCol.updateOne({_id: new ObjectId(userId)}, {$set: {favoriteList: outFavoriteList}});
    return {msg: '移除最愛成功'};
}

async function getFavorite(userId: string) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    if (!userDoc.favoriteList) return [];
    let favoriteList: any[] = userDoc.favoriteList.map((favorite: favoriteItem) => ({
        updateTime: favorite.updateTime || new Date(0),
        placeId: favorite.placeId || "",
        photos: favorite.photos || [],
        name: favorite.name || "",
        vicinity: favorite.vicinity || "",
        workDay: favorite.workDay || [],
        dine_in: favorite.dine_in || false,
        takeout: favorite.takeout || false,
        delivery: favorite.delivery || false,
        website: favorite.website || "",
        phone: favorite.phone || "",
        rating: favorite.rating || 0,
        ratings_total: favorite.ratings_total || 0,
        price_level: favorite.price_level || 0,
        location: favorite.location ? {
            lat: favorite.location.coordinates[1],
            lng: favorite.location.coordinates[0]
        } : {lat: 0, lng: 0},
        url: favorite.url || ""
    }))
    return favoriteList;
}

export default {
    register,
    loginByDevice,
    deleteAccount,
    getImage,
    setImage,
    setPassword,
    addFcmToken,
    logoutByDevice,
    pushFavorite,
    pullFavorite,
    getFavorite
};
