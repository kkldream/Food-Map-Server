export default interface googlePlaceDocument {
    creatTime: Date;
    updateTime: Date;
    place: placeItem;
    detail: any;
    originalPlace: originalGooglePlaceItem;
    originalDetail: any;
}

export interface placeItem {
    updateTime: Date,
    place_id: string,
    status: string,
    name: string,
    photos: photosItem[],
    rating: {
        star: number,
        total: number
    },
    address: string,
    location: locationItem,
    icon: {
        url: string,
        background_color: string,
        mask_base_uri: string,
    },
    types: string[],
    opening_hours: {
        periods: any[],
        special_days: any[],
        type: string,
        weekday_text: string[]
    }
}

export interface locationItem {
    type: string,
    coordinates: number[]
}

export interface originalGooglePlaceResult {
    html_attributions: any[];
    next_page_token: string;
    results: originalGooglePlaceItem[];
    status: string;
}

export interface originalGooglePlaceItem {
    "business_status": string;
    "geometry": {
        "location": {
            "lat": number,
            "lng": number,
        },
        "viewport": {
            "northeast": {
                "lat": number,
                "lng": number,
            },
            "southwest": {
                "lat": number,
                "lng": number,
            }
        }
    };
    "icon": string;
    "icon_background_color": string;
    "icon_mask_base_uri": string;
    "name": string;
    "opening_hours": {
        "open_now": boolean | undefined,
        "periods": any[] | undefined,
        "special_days": any[] | undefined,
        "type": string | undefined,
        "weekday_text": string[] | undefined,
    };
    "photos": photosItem[];
    "place_id": string;
    "plus_code": {
        "compound_code": string,
        "global_code": string,
    };
    "rating": number;
    "reference": string;
    "scope": string;
    "types": string[];
    "user_ratings_total": number;
    "vicinity": string;
}

export interface photosItem {
    height: number,
    width: number,
    photo_reference: string,
    html_attributions: string[]
}
