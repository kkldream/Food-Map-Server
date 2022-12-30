import {baseResponses} from "./baseResponse";
import {latLngItem} from "../pubilcItem";

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
    location: latLngItem;
}
