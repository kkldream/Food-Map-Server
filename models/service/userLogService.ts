import {userLogDocument} from "../dataStruct/mongodb/userLogDocument";

export interface userLogRegisterRequest extends userLogLogInRequest {
    username: string;
    password: string;
    accessKey: string;
}

export async function userLogRegister(req: userLogRegisterRequest) {
    const userLogCol = global.mongodbClient.foodMapDb.userLogCol;
    let userLogDoc: userLogDocument = {
        createTime: new Date(),
        mode: "註冊",
        userId: req.userId,
        deviceId: req.deviceId,
        username: req.username,
        password: req.password,
        accessKey: req.accessKey
    };
    return await userLogCol.insertOne(userLogDoc);
}

export interface userLogLogInRequest {
    userId: string;
    deviceId: string;
}

export async function userLogLogIn(req: userLogLogInRequest) {
    const userLogCol = global.mongodbClient.foodMapDb.userLogCol;
    let userLogDoc: userLogDocument = {
        createTime: new Date(),
        mode: "登入",
        userId: req.userId,
        deviceId: req.deviceId
    };
    return await userLogCol.insertOne(userLogDoc);
}

export interface userLogAddFcmTokenRequest extends userLogLogInRequest {
    userId: string;
    deviceId: string;
    fcmToken: string;
}

export async function userLogAddFcmToken(req: userLogAddFcmTokenRequest) {
    const userLogCol = global.mongodbClient.foodMapDb.userLogCol;
    let userLogDoc: userLogDocument = {
        createTime: new Date(),
        mode: "更新FCM",
        userId: req.userId,
        deviceId: req.deviceId,
        fcmToken: req.fcmToken
    };
    return await userLogCol.insertOne(userLogDoc);
}

export interface userLogLogOutRequest extends userLogLogInRequest {

}

export async function userLogLogOut(req: userLogLogOutRequest) {
    const userLogCol = global.mongodbClient.foodMapDb.userLogCol;
    let userLogDoc: userLogDocument = {
        createTime: new Date(),
        mode: "登出",
        userId: req.userId,
        deviceId: req.deviceId
    };
    return await userLogCol.insertOne(userLogDoc);
}


export interface userLogDeleteAccountRequest {
    userId: string;
}

export async function userLogDeleteAccount(req: userLogDeleteAccountRequest) {
    const userLogCol = global.mongodbClient.foodMapDb.userLogCol;
    let userLogDoc: userLogDocument = {
        createTime: new Date(),
        mode: "刪除帳號",
        userId: req.userId
    };
    return await userLogCol.insertOne(userLogDoc);
}
