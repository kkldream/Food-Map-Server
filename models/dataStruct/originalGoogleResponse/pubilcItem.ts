export interface latLngLiteral {
    lat: number;
    lng: number;
}

export interface googlePhotosItem {
    height: number;
    width: number;
    photo_reference: string;
    html_attributions: string[]
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

export interface geometry {
    location: latLngLiteral;
    location_type?: locationTypeEnum;
    viewport: {
        northeast: latLngLiteral;
        southwest: latLngLiteral;
    };
    bounds?: {
        northeast: latLngLiteral;
        southwest: latLngLiteral;
    };
}

export enum locationTypeEnum {
    ROOFTOP = "ROOFTOP",
    RANGE_INTERPOLATED = "RANGE_INTERPOLATED",
    GEOMETRIC_CENTER = "GEOMETRIC_CENTER ",
    APPROXIMATE = "APPROXIMATE"
}

export enum googleStatusEnum {
    OK = "OK",
    ZERO_RESULTS = "ZERO_RESULTS",
    OVER_DAILY_LIMIT = "OVER_DAILY_LIMIT ",
    OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
    REQUEST_DENIED = "REQUEST_DENIED",
    INVALID_REQUEST = "INVALID_REQUEST",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
