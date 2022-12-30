import {baseResponses} from "./baseResponse";
import {responseLocationItem} from "./publicItem/responseLocationItem";

export interface autocompletePlaceResponses extends baseResponses{
    result: responseAutocompletePlaceItem[];
}

export interface responseAutocompletePlaceItem {
    place_id: string;
    name: string;
    address: string;
    description: string;
    location: responseLocationItem;
}
