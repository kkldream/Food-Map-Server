import {baseResponses} from "./baseResponse";
import {responseLocationItem} from "./publicItem/responseLocationItem";

export interface autocompleteResponses extends baseResponses{
    result: responseAutocompleteItem[];
}

export interface responseAutocompleteItem {
    place_id: string;
    name: string;
    address: string;
    description: string;
    location?: responseLocationItem;
    isSearch?: boolean; // 前端白癡要求
}
