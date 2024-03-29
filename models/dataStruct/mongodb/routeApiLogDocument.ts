import {ObjectId} from "mongodb";

export interface routeApiLogDocument {
    _id?: ObjectId;
    createTime: Date;
    method: string;
    apiUrl: string;
    apiUrlPath: string[];
    request: {
        params?: any;
        query?: any;
        body?: any;
    };
    userId?: string;
}
