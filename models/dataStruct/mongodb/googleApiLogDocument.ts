import {ObjectId} from "mongodb";
import {googlePlaceResult} from "../originalGoogleResponse/placeResponse";
import {photoItem} from "./photoDocument";
import {placeAutocompletePrediction} from "../originalGoogleResponse/autocompleteResponse";
import {googleDetailItem} from "../originalGoogleResponse/detailResponse";
import {dbLocationItem} from "./pubilcItem";
import {googlePhotosItem} from "../originalGoogleResponse/pubilcItem";
import {googleGeocodeAutocompleteResult} from "../originalGoogleResponse/geocodeAutocompleteResponse";

export interface googleApiLogDocument {
    _id?: ObjectId;
    createTime: Date;
    mode: apiLogModeEnum;
    request:
        placeRequest |
        detailRequest |
        photoRequest |
        autocompleteRequest |
        geocodeAutocompleteRequest;
    response: {
        length: number;
        data:
            googlePlaceResult[] |
            googleDetailItem |
            photoItem |
            placeAutocompletePrediction[] |
            googleGeocodeAutocompleteResult[];
    };
    version?: number;
}

export enum apiLogModeEnum {
    place = "place",
    detail = "detail",
    photo = "photo",
    autocomplete = "autocomplete",
    geocode_autocomplete = "geocode_autocomplete",
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
