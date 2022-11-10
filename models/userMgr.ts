const mongoClient = require('./mongodbMgr');
const { generateUUID } = require('./utils');

const usernameRegex = /^[a-zA-Z0-9]+$/; // 僅限英文及數字
const passwordRegex = /^(?=.{6,})/; // 最少八個位元
const emailRegex = /^(([.](?=[^.]|^))|[\w_%{|}#$~`+!?-])+@(?:[\w-]+\.)+[a-zA-Z.]{2,63}$/; // 電子郵件格式

async function register(username: string, password: string) {
    if (!usernameRegex.test(username) || !passwordRegex.test(password)) return { status: 1, msg: '帳號密碼格式錯誤' };
    return await mongoClient.exec(async (mdb: any) => {
        const userCol = mdb.collection('user');
        let findResult = await userCol.find({ username }).toArray();
        if (findResult.length > 0) return { status: 2, msg: '帳號已註冊' };
        let accessKey = generateUUID();
        await userCol.insertOne({
            createTime: new Date(),
            updateTime: new Date(),
            username, password, accessKey
        });
        return { status: 0, msg: '註冊成功' };
    });
}

async function login(username: string, password: string, deviceId: string) {
    if (!usernameRegex.test(username) || !passwordRegex.test(password)) return { status: 1, msg: '帳號密碼格式錯誤' };
    return await mongoClient.exec(async (mdb: any) => {
        const userCol = mdb.collection('user');
        const loginLogCol = mdb.collection('loginLog');
        let findResult = await userCol.find({ username }).toArray();
        if (findResult.length === 0) return { status: 3, msg: '帳號未註冊' };
        await loginLogCol.updateMany({ username, isUse: true }, { $set: {isUse: false} });
        await loginLogCol.insertOne({
            username,
            deviceId,
            loginTime: new Date(),
            isUse: true
        })
        return {
            status: 0,
            msg: '登入成功',
            accessKey: findResult[0].accessKey
        };
    });
}

async function deleteAccount(username: string, accessKey: string) {
    return await mongoClient.exec(async (mdb: any) => {
        const userCol = mdb.collection('user');
        const loginLogCol = mdb.collection('loginLog');
        let findResult = await userCol.find({ username }).toArray();
        if (findResult.length === 0) return { status: 3, msg: '帳號不存在' };
        if (findResult[0].accessKey !== accessKey) return { status: 4, msg: '驗證錯誤' };
        await loginLogCol.updateMany({ username, isUse: true }, { $set: {isUse: false} });
        await userCol.deleteMany({ username })
        return { status: 0, msg: '刪除帳號成功' };
    });
}

module.exports = {
    register,
    login,
    deleteAccount
};
