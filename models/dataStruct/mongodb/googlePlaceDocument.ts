import {ObjectId} from "mongodb";
import {googlePlaceResult} from "../originalGoogleResponse/placeResponse";
import {googleDetailItem} from "../originalGoogleResponse/detailResponse";
import {dbLocationItem} from "./pubilcItem";
import {latLngItem} from "../pubilcItem";
import {placeOpeningHours} from "../originalGoogleResponse/pubilcItem";

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
    originalPlace: googlePlaceResult | null;
    originalDetail: googleDetailItem | null;
}

export interface dbPlaceItem {
    updateTime: Date;
    place_id: string;
    status: string;
    name: string;
    photos: string[];
    rating: {
        star: number;
        total: number;
    };
    address: string;
    location: latLngItem;
    icon: {
        url: string;
        background_color: string;
        mask_base_uri: string;
    };
    types: string[];
    opening_hours: placeOpeningHours;
}
