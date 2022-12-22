/// Place

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

export interface googlePhotosItem {
    height: number;
    width: number;
    photo_reference: string;
    html_attributions: string[]
}

/// Detail

export interface googleDetailResponse {
    html_attributions: string[];
    result: googleDetailItem;
    status: string;
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

export interface placeOpeningHours {
    open_now?: boolean;
    periods?: placeOpeningHoursPeriod[];
    special_days?: placeOpeningHoursPeriod[];
    type?: string;
    weekday_text?: string[];
}

interface placeOpeningHoursPeriod {
    day: number;
    time: string;
    date: string;
    truncated: boolean;
}

export interface latLngLiteral {
    lat: number;
    lng: number;
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

/// Autocomplete

export interface googleAutocompleteResponse {
    predictions: placeAutocompletePrediction[];
    status: string;
    error_message?: string;
    info_messages?: string[];
}

export interface placeAutocompletePrediction {
    description: string;
    matched_substrings: placeAutocompleteMatchedSubstring[];
    structured_formatting: placeAutocompleteStructuredFormat ;
    terms: placeAutocompleteTerm[];
    distance_meters: number;
    place_id: string;
    types: string[];
}

interface placeAutocompleteMatchedSubstring {
    length: number;
    offset: number;
}

interface placeAutocompleteStructuredFormat  {
    main_text: string;
    main_text_matched_substrings: placeAutocompleteMatchedSubstring[];
    secondary_text: string;
    secondary_text_matched_substrings: placeAutocompleteMatchedSubstring[];
}

interface placeAutocompleteTerm {
    offset: number;
    value: string;
}


