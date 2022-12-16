import {ObjectId} from "mongodb";

export interface blackListDocument {
    _id?: ObjectId;
    createTime: Date;
    updateTime: Date;
    place_id: string;
    name: string;
    comment: string;
}
