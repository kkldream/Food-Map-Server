import {responseLocationItem} from "./publicItem/responseLocationItem";
import {googleDetailItem, googleDetailResponse, googlePhotosItem} from "../mongodb/originalGooglePlaceData";
import {baseResponses} from "./baseResponse";

export interface detailResponses extends baseResponses{
    result: responseDetailResult;
}

export interface responseDetailResult {
    updated: boolean;
    isFavorite: boolean;
    result: googleDetailResponse;
}
