import mongoClient from '../mongodbMgr';
import dotenv from 'dotenv';
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
        this.status = -1;
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

    async verifyUser(username: string, accessKey: string) {
        return await mongoClient.exec(async (mdb: any) => {
            const userCol = mdb.collection('user');
            let userDoc = await userCol.find({ username }).toArray();
            if (userDoc.length === 0) {
                this.verify = false;
                this.status = 3;
                throw { msg: '帳號不存在' };
            }
            if (userDoc[0].accessKey !== accessKey) {
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
