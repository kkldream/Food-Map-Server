import {googlePhotosItem, latLngLiteral, placeOpeningHours} from "./pubilcItem";

export interface googlePlaceResponse {
    html_attributions: string[];
    next_page_token: string;
    results: googlePlaceResult[];
    status: string;
}

export interface googlePlaceResult {
    updateTime?: Date; // 自己加的
    business_status: string;
    geometry: {
        location: latLngLiteral;
        viewport: {
            northeast: latLngLiteral;
            southwest: latLngLiteral;
        }
    };
    icon: string;
    icon_background_color: string;
    icon_mask_base_uri: string;
    name: string;
    opening_hours?: placeOpeningHours;
    photos: googlePhotosItem[];
    place_id: string;
    plus_code: {
        compound_code: string;
        global_code: string;
    };
    rating: number;
    reference: string;
    scope: string;
    types: string[];
    user_ratings_total: number;
    vicinity: string;
}
