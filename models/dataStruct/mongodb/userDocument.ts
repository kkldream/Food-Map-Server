import {ObjectId} from "mongodb";
import {foodTypeEnum} from "../staticCode/foodTypeEnum";

export interface userDocument {
    _id?: ObjectId;
    createTime: Date;
    updateTime: Date;
    username: string;
    password: string;
    accessKey: string;
    userImage: string;
    devices: deviceItem[];
    favoriteList: string[];
    blackList: string[];
}

interface deviceItem {
    deviceId: string;
    fcmToken: string;
    isUse: boolean;
}
