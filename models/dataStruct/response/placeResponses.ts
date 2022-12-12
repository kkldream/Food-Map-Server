import {responseLocationItem} from "./publicItem/responseLocationItem";
import {googlePhotosItem, placeOpeningHours} from "../mongodb/originalGooglePlaceData";
import {baseResponses} from "./baseResponse";
import {dbPhotoItem} from "../mongodb/googlePlaceDocument";

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
    placeId: string;
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
    distance: number;
    isFavorite: boolean;
}
