import {baseResponses} from "./baseResponse";
import {latLngItem} from "../pubilcItem";
import {placeOpeningHours} from "../originalGoogleResponse/pubilcItem";

export interface blackListResponses extends baseResponses{
    result: blackListResult;
}

export interface blackListResult {
    placeCount: number;
    placeList: blackListItem[];
}

export interface blackListItem {
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
