import {latLngItem} from "../pubilcItem";

export interface favoriteResult {
    placeCount: number;
    placeList: favoriteItem[];
}

export interface favoriteItem {
    updateTime: Date;
    place_id: string;
    photos: string[]; // 多張
    name: string;
    vicinity: string;
    workDay: string[]; // 營業時段 可能為null
    dine_in: boolean; // 內用
    takeout: boolean; // 外帶
    delivery: boolean; // 外送
    website: string; // 網站 可能為null
    phone: string; // 電話 可能為null
    rating: number;
    ratings_total: number;
    price_level: number;
    location: latLngItem;
    url: string;
}
