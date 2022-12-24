import {ObjectId} from "mongodb";
import {dbLocationItem} from "./publicItem/dbLocationItem";
import {
    googleDetailItem,
    googlePhotosItem,
    googlePlaceResult,
    placeAutocompletePrediction
} from "./originalGooglePlaceData";
import {photoItem} from "./photoDocument";

export interface googleApiLogDocument {
    _id?: ObjectId;
    createTime: Date;
    mode: string;
    request: {
        searchPageNum: number;
        location: dbLocationItem;
        type: string;
        keyword?: string;
        rankby?: string;
        radius?: number;
    } | { place_id: string; } | { photoReference: googlePhotosItem; } | {
        input: string;
        type: string;
        radius: number | string;
        location: dbLocationItem;
    };
    response: {
        length: number;
        data: googlePlaceResult[] | googleDetailItem | photoItem | placeAutocompletePrediction[];
    };
}
