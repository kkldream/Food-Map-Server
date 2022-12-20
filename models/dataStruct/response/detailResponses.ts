import {placeReview} from "../mongodb/originalGooglePlaceData";
import {baseResponses} from "./baseResponse";
import {responseLocationItem} from "./publicItem/responseLocationItem";

export interface detailResponses extends baseResponses{
    result: responseDetailItem;
}

export interface responseDetailResult {
    updated: boolean;
    isFavorite: boolean;
    updateTime: Date;
    place: responseDetailItem;
    isBlackList: boolean;
}

export interface responseDetailItem {
    opening_hours: {
        open_now: boolean;
        weekday_text: string[];
    };
    delivery: boolean;
    dine_in: boolean;
    address: string;
    phone: string;
    location: responseLocationItem;
    name: string;
    photos: string[];
    place_id: string;
    price_level: number;
    rating: number;
    reviews: placeReview[];
    takeout: boolean;
    url: string;
    ratings_total: number;
    vicinity: string;
    website: string;
}
