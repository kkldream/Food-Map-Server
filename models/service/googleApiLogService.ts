import {googlePlaceResult,} from "../dataStruct/originalGoogleResponse/placeResponse";
import {
    apiLogModeEnum,
    autocompleteRequest,
    detailRequest,
    geocodeAutocompleteRequest,
    googleApiLogDocument,
    photoRequest,
    placeRequest
} from "../dataStruct/mongodb/googleApiLogDocument";
import {photoItem} from "../dataStruct/mongodb/photoDocument";
import {responseLocationConvertDb} from "../utils";
import {placeAutocompletePrediction} from "../dataStruct/originalGoogleResponse/autocompleteResponse";
import {googleDetailItem} from "../dataStruct/originalGoogleResponse/detailResponse";
import {googlePhotosItem} from "../dataStruct/originalGoogleResponse/pubilcItem";
import {latLngItem} from "../dataStruct/pubilcItem";
import {googleGeocodeAutocompleteResult} from "../dataStruct/originalGoogleResponse/geocodeAutocompleteResponse";
import {dbInsertResponse} from "../dataStruct/mongodb/pubilcItem";
import {computeRoutesResponse} from "../dataStruct/originalGoogleResponse/computeRoutesResponse";
import {googleRoutesApiRequest} from "../dataStruct/request/googleRoutesApiRequest";

function googleApiLogInsertDoc(doc: googleApiLogDocument): Promise<dbInsertResponse> {
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
    doc.version = "v1.0";
    return googleApiLogCol.insertOne(doc);
}

export function insertGoogleApiPlaceLog(req: {
    searchPageNum: number;
    location: latLngItem;
    type: string;
    keyword?: string;
    distance: number;
    response: googlePlaceResult[];
}) {
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: apiLogModeEnum.place,
        request: ({
            searchPageNum: req.searchPageNum,
            location: responseLocationConvertDb(req.location),
            type: req.type,
            keyword: req.keyword ?? null,
            rankby: req.distance === -1 ? "distance" : null,
            radius: req.distance !== -1 ? req.distance : null
        } as placeRequest),
        response: {
            length: req.response.length,
            data: req.response as googlePlaceResult[]
        }
    }
    return googleApiLogInsertDoc(googleApiLogDoc);
}

export function insertGoogleApiDetailLog(req: {
    place_id: string;
    response: googleDetailItem;
}) {
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: apiLogModeEnum.detail,
        request: ({
            place_id: req.place_id
        } as detailRequest),
        response: {
            length: 1,
            data: req.response as googleDetailItem
        }
    };
    return googleApiLogInsertDoc(googleApiLogDoc);
}

export function insertGoogleApiPhotoLog(req: {
    photoReference: googlePhotosItem;
    response: photoItem;
}) {
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: apiLogModeEnum.photo,
        request: ({
            photoReference: req.photoReference
        } as photoRequest),
        response: {
            length: 1,
            data: req.response as photoItem
        }
    };
    return googleApiLogInsertDoc(googleApiLogDoc);
}

export function insertGoogleApiAutocompleteLog(req: {
    input: string;
    type: string | undefined;
    distance: number;
    location: latLngItem;
    response: placeAutocompletePrediction[];
}) {
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: apiLogModeEnum.autocomplete,
        request: ({
            input: req.input,
            type: req.type ?? null,
            radius: req.distance !== -1 ? req.distance : null,
            location: responseLocationConvertDb(req.location)
        } as autocompleteRequest),
        response: {
            length: req.response.length,
            data: req.response as placeAutocompletePrediction[]
        }
    };
    return googleApiLogInsertDoc(googleApiLogDoc);
}

export function insertGoogleApiGeocodeAutocompleteLog(req: {
    location?: latLngItem;
    address?: string;
    response: googleGeocodeAutocompleteResult[];
}) {
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: apiLogModeEnum.geocode_autocomplete,
        request: ({
            location: req.location ? responseLocationConvertDb(req.location) : null,
            address: req.address ?? null,
        } as geocodeAutocompleteRequest),
        response: {
            length: req.response.length,
            data: req.response as googleGeocodeAutocompleteResult[]
        }
    };
    return googleApiLogInsertDoc(googleApiLogDoc);
}

export function insertGoogleApiComputeRoutesLog(req: {
    request: googleRoutesApiRequest;
    response: computeRoutesResponse;
}) {
    let googleApiLogDoc: googleApiLogDocument = {
        createTime: new Date(),
        mode: apiLogModeEnum.geocode_autocomplete,
        request: (req.request as googleRoutesApiRequest),
        response: {
            length: (req.response as computeRoutesResponse).routes.length,
            data: (req.response as computeRoutesResponse)
        }
    };
    return googleApiLogInsertDoc(googleApiLogDoc);
}
