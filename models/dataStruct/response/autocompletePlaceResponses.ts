import {baseResponses} from "./baseResponse";
import {latLngItem} from "../pubilcItem";

export interface autocompletePlaceResponses extends baseResponses{
    result: responseAutocompletePlaceItem[];
}

export interface responseAutocompletePlaceItem {
    place_id: string;
    name: string;
    address: string;
    description: string;
    location: latLngItem;
}
