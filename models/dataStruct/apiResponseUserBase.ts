import dotenv from 'dotenv';
import {ObjectId} from 'mongodb';
import {errorCodes, throwError} from "./throwError";

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
            throwError(errorCodes.accessKeyVerifyError);
        }
        this.status = 0;
        this.verify = true;
        return {msg: '驗證成功'};
    }

    async verifyUser(userId: string, accessKey: string) {
        let userDoc = await global.mongodbClient.foodMapDb.userCol.findOne({_id: new ObjectId(userId)});
        if (!userDoc) {
            this.verify = false;
            this.status = 3;
            throwError(errorCodes.accountNotFound);
        }
        if (userDoc.accessKey !== accessKey) {
            this.verify = false;
            this.status = 4;
            throwError(errorCodes.accessKeyVerifyError);
        }
        this.verify = true;
        this.status = 0;
        return {msg: '驗證成功'};
    }
}

export default apiResponseBase;
