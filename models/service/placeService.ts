import {ObjectId} from "mongodb";
import {userDocument} from "../dataStruct/mongodb/userDocument";

export async function isFavoriteByUserId(userId: string, place_id: string) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    let favoriteIdList: string[] = userDoc.favoriteList;
    return favoriteIdList.includes(place_id);
}
