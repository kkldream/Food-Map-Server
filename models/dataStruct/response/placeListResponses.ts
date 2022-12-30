import {responseLocationItem} from "./publicItem/responseLocationItem";
import {baseResponses} from "./baseResponse";

export interface placeListResponses extends baseResponses{
    result: placeListResult;
}

export interface placeListResult {
    placeCount: number;
    placeList: placeListItem[];
}

export interface placeListItem {
    place_id: string;
    name: string;
    address: string;
    location: responseLocationItem;
}
