import {ObjectId} from "mongodb";
import {userDocument} from "../dataStruct/mongodb/userDocument";
import config from "../../config";

export async function getBlackList(): Promise<string[]> {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userQuery = {_id: new ObjectId(config.root.userId)};
    let userDoc: userDocument = await userCol.findOne(userQuery);
    return userDoc.blackList ?? []
}
