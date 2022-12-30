import {baseResponses} from "./baseResponse";
import {photoItem} from "../mongodb/photoDocument";

export interface photoResponses extends baseResponses {
    result: photoResult;
}

export interface photoResult extends photoItem {
    updateTime: Date;
    photo_reference?: string;
    uploadUser?: {
        name: string;
        url: string;
    };
}
