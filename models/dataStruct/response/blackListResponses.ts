import {responseLocationItem} from "./publicItem/responseLocationItem";
import {placeOpeningHours} from "../mongodb/originalGooglePlaceData";
import {baseResponses} from "./baseResponse";

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
    location: responseLocationItem;
    icon: {
        url: string;
        background_color: string;
        mask_base_uri: string;
    };
    types: string[];
    opening_hours: placeOpeningHours;
}
