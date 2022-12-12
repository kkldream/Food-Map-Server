import {ObjectId} from "mongodb";
import {googleDetailItem, googlePhotosItem, googlePlaceResult, placeOpeningHours} from "./originalGooglePlaceData";
import {dbLocationItem} from "./publicItem/dbLocationItem";
import {responseLocationItem} from "../response/publicItem/responseLocationItem";

export interface dbPlaceDocument {
    _id?: ObjectId;
    creatTime: Date;
    updateTime: Date;

    // 整理後的資料
    place_id: string;
    location: dbLocationItem;
    types: string[];
    name: string;

    content: dbPlaceItem;

    // google api 的原始資料
    originalPlace: googlePlaceResult;
    originalDetail: googleDetailItem | null;
}

export interface dbPlaceItem {
    updateTime: Date;
    place_id: string;
    status: string;
    name: string;
    photos: dbPhotoItem[];
    rating: {
        star: number;
        total: number;
    };
    address: string;
    location: responseLocationItem;
    icon: {
        url: string;
        background_color: string;
        mask_base_uri: string;
    };
    types: string[];
    opening_hours: placeOpeningHours;
}

export interface dbPhotoItem {
    width: number;
    height: number;
    data: string;
    length: number;
    format: string;
}
