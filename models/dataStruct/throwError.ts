import {apiError} from "./response/baseResponse";

export enum errorCodes {
    unknown = -1,
    ok = 0,
    accountPasswordError = 1,
    accountRegistered = 2,
    accountNotFound = 3,
    accessKeyVerifyError = 4,
    requestDataError = 5,
    loginDeviceNotFound = 6,
    favoriteNotFound = 7,
    photoNotFound = 8,
    placeNotFound = 9,
}

export function throwError(errorCode: errorCodes, msg: string = ''): apiError {
    let status = errorCode ?? errorCodes.unknown;
    if (msg === '')
        switch (errorCode) {
            case errorCodes.ok:
                msg = '回應成功';
                break;
            case errorCodes.accountPasswordError:
                msg = '帳號密碼錯誤';
                break;
            case errorCodes.accountRegistered:
                msg = '帳號已註冊';
                break;
            case errorCodes.accountNotFound:
                msg = '帳號不存在';
                break;
            case errorCodes.accessKeyVerifyError:
                msg = 'accessKey驗證錯誤';
                break;
            case errorCodes.requestDataError:
                msg = '請求內容錯誤';
                break;
            case errorCodes.loginDeviceNotFound:
                msg = '無此裝置登入資料';
                break;
            case errorCodes.favoriteNotFound:
                msg = '無最愛紀錄';
                break;
            case errorCodes.photoNotFound:
                msg = '照片不存在';
                break;
            case errorCodes.placeNotFound:
                msg = '地點不存在';
                break;
            default:
                msg = '未知錯誤';
                break;
        }
    throw {status, text: msg};
}

export function isUndefined(argus: any[]) {
    for (const argu of argus) {
        if (argu === undefined)
            return true;
    }
    return false;
}
