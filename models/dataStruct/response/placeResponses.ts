import {responseLocationItem} from "./publicItem/responseLocationItem";
import {googlePhotosItem} from "../mongodb/originalGooglePlaceData";
import {baseResponses} from "./baseResponse";

export interface placeResponses extends baseResponses{
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
    uid: string;
    status: string;
    name: string;
    photos: googlePhotosItem[];
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
    opening_hours: {
        periods: any[];
        special_days: any[];
        type: string;
        weekday_text: string[];
    };
    isFavorite?: boolean;
}
