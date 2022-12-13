import {ObjectId} from "mongodb";

export interface blackListDocument {
    _id?: ObjectId;
    creatTime: Date;
    updateTime: Date;
    place_id: string;
    name: string;
    comment: string;
}
