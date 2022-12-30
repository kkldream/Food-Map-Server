import {googlePhotosItem, googleStatusEnum, latLngLiteral, placeOpeningHours} from "./pubilcItem";

export interface googleDetailResponse {
    html_attributions: string[];
    result: googleDetailItem;
    status: googleStatusEnum;
}

export interface googleDetailItem {
    updateTime?: Date; // 自己加的
    address_components: {
        long_name: string;
        short_name: string;
        types: string[];
    };
    adr_address: string;
    business_status: string;
    curbside_pickup: boolean;
    current_opening_hours?: placeOpeningHours;
    delivery: boolean;
    dine_in: boolean;
    editorial_summary: {
        language: string;
        overview: string;
    };
    formatted_address: string;
    formatted_phone_number: string;
    geometry: {
        location: latLngLiteral;
        viewport: {
            northeast: latLngLiteral;
            southwest: latLngLiteral;
        };
    };
    icon: string;
    icon_background_color: string;
    icon_mask_base_uri: string;
    international_phone_number: string;
    name: string;
    opening_hours?: placeOpeningHours;
    permanently_closed?: boolean; // deprecated
    photos: googlePhotosItem[];
    place_id: string;
    plus_code: {
        compound_code: string;
        global_code: string;
    };
    price_level: number; // 0~4
    rating: number;
    reference?: string; // deprecated
    reservable: boolean;
    reviews: placeReview[];
    scope?: string; // deprecated
    secondary_opening_hours?: placeOpeningHours;
    serves_beer: boolean;
    serves_dinner: boolean;
    serves_lunch: boolean;
    serves_vegetarian_food: boolean;
    serves_wine: boolean;
    takeout: boolean;
    types: string[];
    url: string;
    user_ratings_total: number;
    utc_offset: number;
    vicinity: string;
    website: string;
    wheelchair_accessible_entrance: boolean;
}

export interface placeReview {
    author_name: string;
    rating: number;
    relative_time_description: string;
    time: number;
    author_url: string;
    language: string;
    original_language: string;
    profile_photo_url: string;
    text: string;
    translated: boolean;
}
