import {ObjectId} from "mongodb";
import {dbLocationItem} from "./publicItem/dbLocationItem";

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
    placeList?: placeItem[];
}

interface deviceItem {
    deviceId: string;
    fcmToken: string;
    isUse: boolean;
}

export interface placeItem {
    place_id: string;
    name: string;
    address: string;
    location: dbLocationItem;
}
