import {errorCodes, isUndefined, throwError} from "./dataStruct/throwError";
import {responseLocationConvertDb} from "./utils";
import config from "../config"
import {googlePlaceResult} from "./dataStruct/mongodb/originalGooglePlaceData";
import {dbPlaceDocument, dbPlaceItem} from "./dataStruct/mongodb/googlePlaceDocument";
import {callGoogleApiDetail, callGoogleApiNearBySearch} from "./service/googleApiService";
import {responseLocationItem} from "./dataStruct/response/publicItem/responseLocationItem";
import {responseDetailResult} from "./dataStruct/response/detailResponses";
import {isFavoriteByUserId} from "./service/placeService";

// https://developers.google.com/maps/documentation/places/web-service/supported_types
const FOOD_TYPE_LIST = config.foodTypeList;

async function updateCustom(latitude: number, longitude: number, radius: number, keyword: string) {
    if (!latitude || !longitude || !radius || !keyword) throwError(errorCodes.requestDataError);
    let resultStatus = {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };
    for (const type of FOOD_TYPE_LIST) {
        let result = await nearBySearch(3, {
            location: {lat: latitude, lng: longitude},
            type,
            keyword,
            radius
        }, "custom");
        resultStatus.upsertCount += result.upsertCount;
        resultStatus.matchCount += result.matchCount;
        resultStatus.modifiedCount += result.modifiedCount;
    }
    return resultStatus;
}

async function updatePlaceByDistance(latitude: number, longitude: number, searchPageNum: number = 1) {
    if (!latitude || !longitude) throwError(errorCodes.requestDataError);
    let resultStatus = {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };
    for (const type of FOOD_TYPE_LIST) {
        let result = await nearBySearch(searchPageNum, {
                location: {lat: latitude, lng: longitude},
                type,
                keyword: "",
                radius: -1
            }, "search_by_near"
        );
        resultStatus.upsertCount += result.upsertCount;
        resultStatus.matchCount += result.matchCount;
        resultStatus.modifiedCount += result.modifiedCount;
    }
    return resultStatus;
}

async function updatePlaceByKeyword(latitude: number, longitude: number, keyword: string, searchPageNum: number = 1) {
    if (!latitude || !longitude || !keyword) throwError(errorCodes.requestDataError);
    let resultStatus = {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };
    for (const type of FOOD_TYPE_LIST) {
        let result = await nearBySearch(searchPageNum, {
                location: {lat: latitude, lng: longitude},
                type,
                keyword,
                radius: -1
            }, "search_by_keyword"
        );
        resultStatus.upsertCount += result.upsertCount;
        resultStatus.matchCount += result.matchCount;
        resultStatus.modifiedCount += result.modifiedCount;
    }
    return resultStatus;
}

// https://developers.google.com/maps/documentation/places/web-service/search-nearby
async function nearBySearch(searchPageNum: number, request: { location: responseLocationItem; type: string; keyword: string; radius: number; }, msg: string = "") {
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let requestTime: Date = new Date();

    let {location, type, keyword, radius} = request;
    let googlePlaceList: googlePlaceResult[] = await callGoogleApiNearBySearch(searchPageNum, location, type, keyword, radius);

    let dbPlaceDocumentList: dbPlaceDocument[] = await Promise.all(googlePlaceList.map(async (googlePlace: googlePlaceResult): Promise<dbPlaceDocument> => {
        let dbPlace: dbPlaceItem = {
            updateTime: new Date(),
            place_id: googlePlace.place_id || '',
            status: googlePlace.business_status || '',
            name: googlePlace.name || '',
            photos: googlePlace.photos || [],
            rating: {
                star: googlePlace.rating || 0,
                total: googlePlace.user_ratings_total || 0,
            },
            address: googlePlace.vicinity || '',
            location: googlePlace.geometry.location,
            icon: {
                url: googlePlace.icon,
                background_color: googlePlace.icon_background_color,
                mask_base_uri: googlePlace.icon_mask_base_uri,
            },
            types: googlePlace.types,
            opening_hours: {
                periods: googlePlace.opening_hours?.periods || [],
                special_days: googlePlace.opening_hours?.special_days || [],
                type: googlePlace.opening_hours?.type || "",
                weekday_text: googlePlace.opening_hours?.weekday_text || [],
            }
        };
        googlePlace.updateTime = requestTime;
        let findResult = await placeCol.findOne({"place.place_id": googlePlace.place_id});
        return {
            creatTime: findResult ? findResult.creatTime : requestTime,
            updateTime: requestTime,
            place_id: dbPlace.place_id,
            location: responseLocationConvertDb(dbPlace.location),
            types: dbPlace.types,
            name: dbPlace.name,
            content: dbPlace,
            originalPlace: googlePlace,
            originalDetail: findResult ? findResult.originalDetail : null
        }
    }));

    if (dbPlaceDocumentList.length === 0) {
        return {
            upsertCount: 0,
            matchCount: 0,
            modifiedCount: 0
        };
    }

    // 更新DB資料
    let bulkWritePipe = dbPlaceDocumentList.map(dbPlace => ({
        updateOne: {
            filter: {place_id: dbPlace.place_id},
            update: {$set: dbPlace},
            upsert: true
        }
    }));
    let result = await placeCol.bulkWrite(bulkWritePipe);
    return {
        upsertCount: result.nUpserted,
        matchCount: result.nMatched,
        modifiedCount: result.nModified
    };
}

// https://developers.google.com/maps/documentation/places/web-service/details
async function detailsByPlaceId(userId: string, place_id: string): Promise<responseDetailResult> {
    if (isUndefined([place_id])) throwError(errorCodes.requestDataError);
    let requestTime: Date = new Date();
    let isFavorite = await isFavoriteByUserId(userId, place_id);
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let findResult: dbPlaceDocument = await placeCol.findOne({place_id});
    if (findResult.originalDetail !== null && requestTime.getTime() - (findResult.originalDetail.updateTime?.getTime() ?? 0) < config.detailUpdateRangeSecond * 1000) {
        return {
            updated: false,
            isFavorite,
            result: {
                html_attributions: [],
                result: findResult.originalDetail,
                status: "OK"
            },
        };
    }
    let response = await callGoogleApiDetail(place_id);
    return {
        updated: true,
        isFavorite: isFavorite,
        result: response
    };
}

export default {
    updateCustom,
    updatePlaceByDistance,
    updatePlaceByKeyword,
    detailsByPlaceId
};
