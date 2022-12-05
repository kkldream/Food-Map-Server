export default interface placeDocument {
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

export interface locationItem {
    type: string,
    coordinates: number[]
}

interface photosItem {
    height: number,
    width: number,
    photo_reference: string,
    html_attributions: string[]
}
