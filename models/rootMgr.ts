import config from "../config"
import userMgr from "./userMgr";
import {photoItem} from "./dataStruct/mongodb/photoDocument";
import {compressUrlImageToBase64, getPhotoId} from "./service/imageService";
import {fcmSendMessage} from "./service/fcmService";
import {ObjectId} from "mongodb";

async function pushBlackList(placeIdList: string[]) {
    return userMgr.pushBlackList(config.root.userId, placeIdList);
}

async function pullBlackList(placeIdList: string[]) {
    return userMgr.pullBlackList(config.root.userId, placeIdList);
}

async function getBlackList() {
    return userMgr.getBlackList(config.root.userId);
}

async function pushUrlPhoto(url: string): Promise<any> {
    let photo: photoItem = await compressUrlImageToBase64(url, config.image.compressRate);
    let {updated, photoId} = await getPhotoId({
        updateTime: new Date(),
        photoItem: photo
    });
    return {updated, photoId, content: photo};
}

async function fcmSend(userIdList: string[], notification: { title: string; body: string; }, data: any) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let pipeline = [
        {"$unwind": {"path": "$devices"}},
        {
            "$match": {
                "devices.isUse": true,
                "devices.deviceId": {"$ne": "web"},
                "_id": {"$in": userIdList.map(userId => new ObjectId(userId))}
            }
        },
        {
            "$project": {
                "username": 1,
                "deviceId": "$devices.deviceId",
                "fcmToken": "$devices.fcmToken"
            }
        }
    ];
    let cursor: { _id: ObjectId; username: string; deviceId: string; fcmToken: string; }[] = await userCol.aggregate(pipeline, {allowDiskUse: false}).toArray();
    let fcmTokenList: string[] = cursor.map(e => e.fcmToken);
    let fcmSendResult = await fcmSendMessage(fcmTokenList, {
        title: notification.title,
        body: notification.body,
        data: data,
        priority: true
    });
    // let result: boolean[] = fcmSendResult.results.map((result: { message_id?: string; error?: string; }) => "message_id" in result);
    return {
        msg: `find ${fcmTokenList.length} fcmTokens in ${userIdList.length} peoples`,
        successCount: fcmSendResult.success,
        failCount: fcmSendResult.failure
    }
}

export default {
    pushBlackList,
    pullBlackList,
    getBlackList,
    pushUrlPhoto,
    fcmSend,
};
