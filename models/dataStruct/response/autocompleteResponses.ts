import {latLngItem} from "../pubilcItem";

export interface responseAutocompleteResult {
    updated: boolean;
    placeCount: number;
    placeList: responseAutocompleteItem[];
}

export interface responseAutocompleteItem {
    place_id: string;
    name: string;
    address: string;
    description: string;
    location?: latLngItem;
    isSearch?: boolean; // 前端小帥要求
}
