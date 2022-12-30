import {baseResponses} from "./baseResponse";
import {latLngItem} from "../pubilcItem";

export interface autocompleteResponses extends baseResponses{
    result: responseAutocompleteItem[];
}

export interface responseAutocompleteItem {
    place_id: string;
    name: string;
    address: string;
    description: string;
    location?: latLngItem;
    isSearch?: boolean; // 前端白癡要求
}
