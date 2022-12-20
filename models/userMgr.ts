import {ObjectId} from 'mongodb';
import {generateUUID} from './utils';
import {errorCodes, isUndefined, throwError} from "./dataStruct/throwError";
import {userDocument} from "./dataStruct/mongodb/userDocument";
import {favoriteItem, favoriteResult} from "./dataStruct/response/favoriteResponse";
import {dbPlaceDocument} from "./dataStruct/mongodb/googlePlaceDocument";
import {callGoogleApiDetail} from "./service/googleApiService";
import {googleDetailResponse} from "./dataStruct/mongodb/originalGooglePlaceData";
import {blackListItem, blackListResult} from "./dataStruct/response/blackListResponses";
import {
    userLogAddFcmToken,
    userLogDeleteAccount,
    userLogLogIn,
    userLogLogOut,
    userLogRegister
} from "./service/userLogService";

async function register(username: string, password: string, deviceId: string) {
    if (isUndefined([username, password, deviceId])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;

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
    await userLogRegister({userId: insertResult.insertedId, username, password, accessKey, deviceId});
    return {
        msg: '註冊成功',
        userId: insertResult.insertedId,
        accessKey
    };
}

async function loginByDevice(username: string, password: string, deviceId: string) {
    if (isUndefined([username, password, deviceId])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc = await userCol.findOne({username});
    if (!userDoc) throwError(errorCodes.accountNotFound);
    if (password !== userDoc.password) throwError(errorCodes.accountPasswordError);

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

    // insert login log
    await userLogLogIn({userId: userDoc._id.toString(), deviceId});
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
    // insert login log
    await userLogAddFcmToken({userId: userDoc._id.toString(), deviceId, fcmToken});
    return {msg: '已更新舊fcmToken'};
}

async function logoutByDevice(userId: string, deviceId: string) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc = await userCol.findOne({_id: new ObjectId(userId)});
    if (!userDoc.devices.find((doc: any) => doc.deviceId === deviceId && doc.isUse === true))
        throwError(errorCodes.loginDeviceNotFound);
    // update user document
    await userCol.updateOne(
        {_id: new ObjectId(userId)},
        {$set: {"devices.$[item].isUse": false}},
        {arrayFilters: [{"item.deviceId": deviceId}]}
    );
    // insert login log
    await userLogLogOut({userId, deviceId});
    return {msg: '登出成功'};
}

async function deleteAccount(userId: string) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    await userCol.deleteMany({_id: new ObjectId(userId)});
    // insert login log
    await userLogDeleteAccount({userId});
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
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    let info = {successCount: 0, placeNotFoundCount: 0, favoriteExistCount: 0};
    for (let favoriteId of favoriteIdList) {
        if (!await placeCol.findOne({place_id: favoriteId})) info.placeNotFoundCount += 1;
        else if (userDoc.favoriteList.includes(favoriteId)) info.favoriteExistCount += 1;
        else {
            info.successCount += 1;
            userDoc.favoriteList.push(favoriteId);
        }
    }
    await userCol.updateOne({_id: new ObjectId(userId)}, {$set: {favoriteList: userDoc.favoriteList}});
    return {msg: '添加最愛成功', info};
}

async function pullFavorite(userId: string, favoriteIdList: string[]) {
    if (isUndefined([favoriteIdList])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    let info = {deleteCount: 0};
    let outputFavoriteIdList = userDoc.favoriteList.filter((favoriteId: string) => {
        let result = favoriteIdList.includes(favoriteId);
        if (result) info.deleteCount += 1;
        return !result;
    });
    await userCol.updateOne({_id: new ObjectId(userId)}, {$set: {favoriteList: outputFavoriteIdList}});
    return {msg: '移除最愛成功', info};
}

async function getFavorite(userId: string): Promise<favoriteResult> {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    if (!userDoc.favoriteList) return {placeCount: 0, placeList: []};
    let output: favoriteItem[] = [];
    for (let favoriteId of userDoc.favoriteList) {
        let dbPlace: dbPlaceDocument;
        try { // 避免ObjectId建構失敗
            dbPlace = await placeCol.findOne({place_id: favoriteId});
        } catch (error) {
            continue;
        }
        if (!dbPlace) continue;
        if (dbPlace.originalDetail === null) {
            let response: googleDetailResponse = await callGoogleApiDetail(favoriteId);
            dbPlace.originalDetail = response.result;
        }
        output.push({
            updateTime: dbPlace.updateTime,
            place_id: dbPlace.place_id,
            photos: dbPlace.content.photos,
            name: dbPlace.content.name,
            vicinity: dbPlace.originalDetail.vicinity ?? "",
            workDay: dbPlace.originalDetail.opening_hours?.weekday_text ?? [],
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
        });
    }
    return {placeCount: output.length, placeList: output};
}

async function pushBlackList(userId: string, placeIdList: string[]) {
    if (isUndefined([placeIdList])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let userQuery = {_id: new ObjectId(userId)};
    let userDoc: userDocument = await userCol.findOne(userQuery);
    let info = {successCount: 0, placeNotFoundCount: 0, blackListExistCount: 0};
    for (let placeId of placeIdList) {
        if (!await placeCol.findOne({place_id: placeId})) info.placeNotFoundCount += 1;
        else if (userDoc.blackList.includes(placeId)) info.blackListExistCount += 1;
        else {
            info.successCount += 1;
            userDoc.blackList.push(placeId);
        }
    }
    await userCol.updateOne(userQuery, {$set: {blackList: userDoc.blackList}});
    return {msg: '添加黑名單成功', info};
}

async function pullBlackList(userId: string, placeIdList: string[]) {
    if (isUndefined([placeIdList])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userQuery = {_id: new ObjectId(userId)};
    let userDoc: userDocument = await userCol.findOne(userQuery);
    let info = {deleteCount: 0};
    let newBlackList: string[] = userDoc.blackList.filter((blackId: string) => {
        let result = placeIdList.includes(blackId);
        if (result) info.deleteCount += 1;
        return !result;
    });
    await userCol.updateOne(userQuery, {$set: {blackList: newBlackList}});
    return {msg: '移除黑名單成功', info};
}

async function getBlackList(userId: string): Promise<blackListResult> {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let userQuery = {_id: new ObjectId(userId)};
    let userDoc: userDocument = await userCol.findOne(userQuery);
    let blackListItems: blackListItem[] = [];
    for (let blackId of userDoc.blackList) {
        let placeDoc: dbPlaceDocument;
        try { // 避免ObjectId建構失敗
            placeDoc = await placeCol.findOne({place_id: blackId});
        } catch (error) {
            continue;
        }
        if (!placeDoc) continue;
        blackListItems.push({
            updateTime: placeDoc.updateTime,
            place_id: blackId,
            status: placeDoc.content.status,
            name: placeDoc.name,
            photos: placeDoc.content.photos,
            rating: placeDoc.content.rating,
            address: placeDoc.content.address,
            location: placeDoc.content.location,
            icon: placeDoc.content.icon,
            types: placeDoc.types,
            opening_hours: placeDoc.content.opening_hours,

        });
    }
    return {placeCount: blackListItems.length, placeList: blackListItems}
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
    getBlackList,
};
