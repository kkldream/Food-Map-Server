import {googlePlaceResult,} from "../dataStruct/originalGoogleResponse/placeResponse";
import {geocodeAutocompleteRequest, googleApiLogDocument} from "../dataStruct/mongodb/googleApiLogDocument";
import {photoItem} from "../dataStruct/mongodb/photoDocument";
import {responseLocationConvertDb} from "../utils";
import {placeAutocompletePrediction} from "../dataStruct/originalGoogleResponse/autocompleteResponse";
import {dbLocationItem} from "../dataStruct/mongodb/pubilcItem";
import {googleDetailItem} from "../dataStruct/originalGoogleResponse/detailResponse";
import {googlePhotosItem} from "../dataStruct/originalGoogleResponse/pubilcItem";
import {latLngItem} from "../dataStruct/pubilcItem";
import {googleGeocodeAutocompleteResult} from "../dataStruct/originalGoogleResponse/geocodeAutocompleteResponse";

interface googleApiPlaceLogRequest {
    searchPageNum: number;
    location: dbLocationItem;
    type: string;
    keyword?: string;
    distance: number;
    response: googlePlaceResult[];
}

export async function insertGoogleApiPlaceLog(req: googleApiPlaceLogRequest) {
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: "place",
        request: {
            searchPageNum: req.searchPageNum,
            location: req.location,
            type: req.type,
            keyword: req.keyword,
            rankby: req.distance === -1 ? "distance" : undefined,
            radius: req.distance !== -1 ? req.distance : undefined
        },
        response: {
            length: req.response.length,
            data: req.response
        }
    };
    return await googleApiLogCol.insertOne(googleApiLogDoc);
}

interface googleApiDetailLogRequest {
    place_id: string;
    response: googleDetailItem;
}

export async function insertGoogleApiDetailLog(req: googleApiDetailLogRequest) {
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: "detail",
        request: {place_id: req.place_id},
        response: {length: 1, data: req.response}
    };
    return await googleApiLogCol.insertOne(googleApiLogDoc);
}

interface googleApiPhotoLogRequest {
    photoReference: googlePhotosItem;
    response: photoItem;
}

export async function insertGoogleApiPhotoLog(req: googleApiPhotoLogRequest) {
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: "photo",
        request: {photoReference: req.photoReference},
        response: {length: 1, data: req.response}
    };
    return await googleApiLogCol.insertOne(googleApiLogDoc);
}

interface googleApiAutocompleteLogRequest {
    input: string;
    type: string | undefined;
    radius: number | string;
    location: dbLocationItem;
    response: placeAutocompletePrediction[];
}

export async function insertGoogleApiAutocompleteLog(req: googleApiAutocompleteLogRequest) {
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: "autocomplete",
        request: {
            input: req.input,
            type: req.type,
            radius: req.radius,
            location: req.location
        },
        response: {length: req.response.length, data: req.response}
    };
    return await googleApiLogCol.insertOne(googleApiLogDoc);
}

interface googleApiGeocodeAutocompleteLogRequest {
    location?: latLngItem;
    address?: string;
    response: googleGeocodeAutocompleteResult[];
}

export async function insertGoogleApiGeocodeAutocompleteLog(req: googleApiGeocodeAutocompleteLogRequest) {
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
    let request: geocodeAutocompleteRequest = {
        location: req.location ? responseLocationConvertDb(req.location) : undefined,
        address: req.address ?? undefined,
    }
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: "geocode_autocomplete",
        request,
        response: {length: req.response.length, data: req.response}
    };
    return await googleApiLogCol.insertOne(googleApiLogDoc);
}
