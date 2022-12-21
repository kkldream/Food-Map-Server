import {ObjectId} from "mongodb";
import {userDocument} from "../dataStruct/mongodb/userDocument";
import config from "../../config";

export async function getBlackList(userId: string): Promise<string[]> {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let rootDoc: userDocument = await userCol.findOne({_id: new ObjectId(config.root.userId)});
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    return [...new Set(rootDoc.blackList.concat(userDoc.blackList))];
}
