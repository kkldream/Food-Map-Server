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
