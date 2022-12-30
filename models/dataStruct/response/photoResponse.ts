import {photoItem} from "../mongodb/photoDocument";

export interface photoResult extends photoItem {
    updateTime: Date;
    photo_reference?: string;
    uploadUser?: {
        name: string;
        url: string;
    };
}
