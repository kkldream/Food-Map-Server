import {ObjectId} from "mongodb";

export interface photoDocument extends photoItem{
    _id?: ObjectId;
    creatTime: Date;
    updateTime: Date;
    photo_reference: string;
    uploadUser: {
        name: string;
        url: string;
    };
}

export interface photoItem {
    width: number;
    height: number;
    data: string;
    length: number;
    format: string;
}
