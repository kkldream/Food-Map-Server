import {ObjectId} from "mongodb";

export interface userLogDocument {
    _id?: ObjectId;
    createTime: Date;
    mode: string;
    userId: string;
    deviceId?: string;
    username?: string;
    password?: string;
    accessKey?: string;
    fcmToken?: string;
}
