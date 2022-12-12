import {ObjectId} from "mongodb";
import {foodTypeEnum} from "../staticCode/foodTypeEnum";

export interface blackListDocument {
    _id?: ObjectId;
    creatTime: Date;
    updateTime: Date;
    place_id: string;
    name: string;
    comment: string;
}
