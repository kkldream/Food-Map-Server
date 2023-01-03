import {ObjectId} from "mongodb";
import {googlePlaceResult} from "../originalGoogleResponse/placeResponse";
import {photoItem} from "./photoDocument";
import {placeAutocompletePrediction} from "../originalGoogleResponse/autocompleteResponse";
import {googleDetailItem} from "../originalGoogleResponse/detailResponse";
import {dbLocationItem} from "./pubilcItem";
import {googlePhotosItem} from "../originalGoogleResponse/pubilcItem";
import {googleGeocodeAutocompleteResult} from "../originalGoogleResponse/geocodeAutocompleteResponse";
import {googleRoutesApiRequest} from "../request/googleRoutesApiRequest";
import {computeRoutesResponse} from "../originalGoogleResponse/computeRoutesResponse";

export interface googleApiLogDocument {
    _id?: ObjectId;
    createTime: Date;
    mode: apiLogModeEnum;
    request:
        placeRequest |
        detailRequest |
        photoRequest |
        autocompleteRequest |
        geocodeAutocompleteRequest |
        googleRoutesApiRequest;
    response: {
        length: number;
        data:
            googlePlaceResult[] |
            googleDetailItem |
            photoItem |
            placeAutocompletePrediction[] |
            googleGeocodeAutocompleteResult[] |
            computeRoutesResponse;
    };
    version?: string;
}

export enum apiLogModeEnum {
    place = "place",
    detail = "detail",
    photo = "photo",
    autocomplete = "autocomplete",
    geocode_autocomplete = "geocode_autocomplete",
    route = "route",
}

export interface placeRequest {
    searchPageNum: number;
    location: dbLocationItem;
    type: string;
    keyword: string | null;
    rankby: string | null;
    radius: number | null;
}

export interface detailRequest {
    place_id: string;
}

export interface photoRequest {
    photoReference: googlePhotosItem;
}

export interface autocompleteRequest {
    input: string;
    type: string | null;
    radius: number | null;
    location: dbLocationItem;
}

export interface geocodeAutocompleteRequest {
    location: dbLocationItem | null;
    address: string | null;
}
