import {baseResponses} from "./baseResponse";
import {latLngItem} from "../pubilcItem";
import {placeOpeningHours} from "../originalGoogleResponse/pubilcItem";

export interface placeResponses extends baseResponses {
    result: responsePlaceResult;
}

export interface responsePlaceResult {
    updated: boolean;
    dbStatus?: any;
    placeCount: number;
    placeList: responsePlaceItem[];
}

export interface responsePlaceItem {
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
    distance: number;
    isFavorite: boolean;
}
