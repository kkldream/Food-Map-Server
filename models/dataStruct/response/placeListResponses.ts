import {responseLocationItem} from "./publicItem/responseLocationItem";
import {placeOpeningHours} from "../mongodb/originalGooglePlaceData";
import {baseResponses} from "./baseResponse";
import {dbLocationItem} from "../mongodb/publicItem/dbLocationItem";

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
