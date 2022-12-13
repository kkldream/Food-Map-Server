import {ObjectId} from 'mongodb';
import {generateUUID} from './utils';
import {errorCodes, isUndefined, throwError} from "./dataStruct/throwError";
import {userDocument} from "./dataStruct/mongodb/userDocument";
import {favoriteItem} from "./dataStruct/response/favoriteResponse";
import {dbPlaceDocument} from "./dataStruct/mongodb/googlePlaceDocument";
import {callGoogleApiDetail} from "./service/googleApiService";
import {googleDetailResponse} from "./dataStruct/mongodb/originalGooglePlaceData";

async function register(username: string, password: string, deviceId: string) {
    if (isUndefined([username, password, deviceId])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const loginLogCol = global.mongodbClient.foodMapDb.loginLogCol;

    let userDoc: userDocument = await userCol.findOne({username});
    if (userDoc) throwError(errorCodes.accountRegistered);

    // insert user document
    let accessKey = generateUUID();
    let insertDoc: userDocument = {
        createTime: new Date(),
        updateTime: new Date(),
        username, password, accessKey,
        userImage: "",
        devices: [{deviceId, fcmToken: "", isUse: true}],
        favoriteList: [],
        blackList: []
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

async function pushFavorite(userId: string, favoriteIdList: string[]) {
    if (isUndefined([favoriteIdList])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    let outputFavoriteIdList: string[] = [...new Set(favoriteIdList.concat(userDoc.favoriteList))];
    await userCol.updateOne({_id: new ObjectId(userId)}, {$set: {favoriteList: outputFavoriteIdList}});
    return {msg: '添加最愛成功'};
}

async function pullFavorite(userId: string, favoriteIdList: string[]) {
    if (isUndefined([favoriteIdList])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    let outputFavoriteIdList = userDoc.favoriteList.filter((favoriteId: string) => !favoriteIdList.includes(favoriteId));
    await userCol.updateOne({_id: new ObjectId(userId)}, {$set: {favoriteList: outputFavoriteIdList}});
    return {msg: '移除最愛成功'};
}

async function getFavorite(userId: string): Promise<favoriteItem[]> {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    if (!userDoc.favoriteList) return [];
    let favoriteList: favoriteItem[] = await Promise.all(userDoc.favoriteList.map(async (favoriteId: string): Promise<favoriteItem> => {
        let dbPlace: dbPlaceDocument = await placeCol.findOne({place_id: favoriteId});
        if (dbPlace.originalDetail === null) {
            let response: googleDetailResponse = await callGoogleApiDetail(favoriteId);
            dbPlace.originalDetail = response.result;
        }
        return {
            updateTime: dbPlace.updateTime,
            placeId: dbPlace.place_id,
            photos: dbPlace.content.photos,
            name: dbPlace.content.name,
            vicinity: dbPlace.originalDetail.vicinity ?? "",
            workDay: dbPlace.originalDetail.opening_hours.weekday_text ?? [],
            dine_in: dbPlace.originalDetail.dine_in ?? false,
            takeout: dbPlace.originalDetail.takeout ?? false,
            delivery: dbPlace.originalDetail.delivery ?? false,
            website: dbPlace.originalDetail.website ?? "",
            phone: dbPlace.originalDetail.formatted_phone_number ?? "",
            rating: dbPlace.content.rating.star,
            ratings_total: dbPlace.content.rating.total,
            price_level: dbPlace.originalDetail.price_level ?? 1,
            location: dbPlace.content.location,
            url: dbPlace.originalDetail.url ?? ""
        }
    }));
    return favoriteList;
}

async function pushBlackList(userId: string, placeIdList: string[]) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userQuery = {_id: new ObjectId(userId)};
    let userDoc: userDocument = await userCol.findOne(userQuery);
    let newBlackList: string[] = [...new Set(userDoc.blackList.concat(placeIdList))];
    await userCol.updateOne(userQuery, {$set: {blackList: newBlackList}});
    return {msg: '添加黑名單成功'};
}

async function pullBlackList(userId: string, placeIdList: string[]) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userQuery = {_id: new ObjectId(userId)};
    let userDoc: userDocument = await userCol.findOne(userQuery);
    let newBlackList: string[] = userDoc.blackList.filter((blackId: string) => !placeIdList.includes(blackId));
    await userCol.updateOne(userQuery, {$set: {blackList: newBlackList}});
    return {msg: '移除黑名單成功'};
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
    getFavorite,
    pushBlackList,
    pullBlackList,
};
