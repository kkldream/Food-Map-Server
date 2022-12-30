import {latLngItem} from "../pubilcItem";
import {placeReview} from "../originalGoogleResponse/detailResponse";

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
    location: latLngItem;
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
