import {errorCodes} from "../throwError";

export interface baseResponses {
    requestTime: Date;
    verify?: boolean;
    status: number;
    errMsg?: apiError;
    result?: any;
}

export interface apiError {
    status?: errorCodes;
    text?: string;
    name?: string;
    message?: string;
    stack?: string;
}

export interface msgItem {
    msg: string;
}
