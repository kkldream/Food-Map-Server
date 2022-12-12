import {placeReview} from "../mongodb/originalGooglePlaceData";
import {baseResponses} from "./baseResponse";
import {responseLocationItem} from "./publicItem/responseLocationItem";
import {dbPhotoItem} from "../mongodb/googlePlaceDocument";

export interface detailResponses extends baseResponses{
    result: responseDetailItem;
}

export interface responseDetailResult {
    updated: boolean;
    isFavorite: boolean;
    updateTime: Date;
    place: responseDetailItem;
}

export interface responseDetailItem {
    current_opening_hours: {
        open_now: boolean;
        weekday_text: string[];
    };
    delivery: boolean;
    dine_in: boolean;
    formatted_address: string;
    formatted_phone_number: string;
    geometry: { location: responseLocationItem };
    name: string;
    photos: dbPhotoItem[];
    place_id: string;
    price_level: number;
    rating: number;
    reviews: placeReview[];
    takeout: boolean;
    url: string;
    user_ratings_total: number;
    vicinity: string;
    website: string;
}
