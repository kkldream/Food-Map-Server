import {ObjectId} from "mongodb";

export interface dbLocationItem {
    type: string,
    coordinates: number[]
}

export interface dbInsertResponse {
    acknowledged: boolean;
    insertedId: ObjectId;
}