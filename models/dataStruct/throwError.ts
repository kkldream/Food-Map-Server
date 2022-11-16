export enum errorCodes {
    unknown = -1,
    ok = 0,
    accountPasswordError = 1,
    accountRegistered = 2,
    accountNotFound = 3,
    accessKeyVerifyError = 4,
    requestDataError = 5,
    loginDeviceNotFound = 6
}

export function throwError(errorCode: errorCodes, msg: string = '') {
    let status = errorCode || errorCodes.unknown;
    if (msg !== '')
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
            default:
                msg = '未知錯誤';
                break;
        }
    throw {status, msg};
}