import {blackListDocument} from "../dataStruct/mongodb/blackListDocument";

export async function getBlackList(): Promise<string[]> {
    const blackListCol = global.mongodbClient.foodMapDb.blackListCol;
    let blackListDoc: blackListDocument[] = await blackListCol.find({}).toArray();
    return blackListDoc.map((blackList: blackListDocument): string => blackList.place_id);
}
