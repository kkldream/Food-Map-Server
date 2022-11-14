import mongoClient from '../mongodbMgr';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
dotenv.config();

class apiResponseBase {
    requestTime: Date;
    status: number;
    result: any;
    errMsg: any;
    verify: boolean | undefined;

    constructor() {
        this.requestTime = new Date();
        this.verify = undefined;
        this.status = 0;
    }

    async verifyRoot(accessKey: string) {
        if (accessKey !== process.env.ROOT_ACCESS_KEY) {
            this.verify = false;
            this.status = 4;
            throw { msg: '驗證錯誤' };
        }
        this.status = 0;
        this.verify = true;
        return { msg: '驗證成功' };
    }

    async verifyUser(userId: string, accessKey: string) {
        return await mongoClient.exec(async (mdb: any) => {
            const userCol = mdb.collection('user');
            let userDoc = await userCol.findOne({ _id: new ObjectId(userId) });
            if (!userDoc) {
                this.verify = false;
                this.status = 3;
                throw { msg: '帳號不存在' };
            }
            if (userDoc.accessKey !== accessKey) {
                this.verify = false;
                this.status = 4;
                throw { msg: '驗證錯誤' };
            }
            this.verify = true;
            this.status = 0;
            return { msg: '驗證成功' };
        });
    }
}

export default apiResponseBase;
