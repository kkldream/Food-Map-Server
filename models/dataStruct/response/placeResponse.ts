import {photosItem, locationItem} from "../mongodb/googlePlaceDocument";

export default interface placeResponse {
    updateTime: Date,
    uid: string,
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
        weekday_text: string
    }
}
