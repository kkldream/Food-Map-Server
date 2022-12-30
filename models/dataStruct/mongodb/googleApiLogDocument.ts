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
    mode: string;
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
}

interface placeRequest {
    searchPageNum: number;
    location: dbLocationItem;
    type: string;
    keyword?: string;
    rankby?: string;
    radius?: number;
}

interface detailRequest {
    place_id: string;
}

interface photoRequest {
    photoReference: googlePhotosItem;
}

interface autocompleteRequest {
    input: string;
    type?: string;
    radius: number | string;
    location: dbLocationItem;
}

export interface geocodeAutocompleteRequest {
    location?: dbLocationItem;
    address?: string;
}
