import {errorCodes, isUndefined, throwError} from "./dataStruct/throwError";
import {responseLocationConvertDb} from "./utils";
import config from "../config"
import {googlePlaceResult} from "./dataStruct/mongodb/originalGooglePlaceData";
import {dbPlaceDocument, dbPlaceItem} from "./dataStruct/mongodb/googlePlaceDocument";
import {callGoogleApiDetail, callGoogleApiNearBySearch} from "./service/googleApiService";
import {responseLocationItem} from "./dataStruct/response/publicItem/responseLocationItem";
import {responseDetailResult} from "./dataStruct/response/detailResponses";
import {isFavoriteByUserId} from "./service/placeService";
import {googleImageListConvertDb} from "./service/imageService";
import {ObjectId} from "mongodb";
import {userDocument} from "./dataStruct/mongodb/userDocument";
import userMgr from "./userMgr";

async function pushBlackList(placeIdList: string[]) {
    return userMgr.pushBlackList(config.root.userId, placeIdList);
}

async function pullBlackList(placeIdList: string[]) {
    return userMgr.pullBlackList(config.root.userId, placeIdList);
}

export default {
    pushBlackList,
    pullBlackList
};
