import {errorCodes, isUndefined, throwError} from "./dataStruct/throwError";
import {responseLocationConvertDb} from "./utils";
import config from "../config"
import {dbPlaceDocument, dbPlaceItem} from "./dataStruct/mongodb/googlePlaceDocument";
import {
    callGoogleApiDetail,
    callGoogleApiKeywordBySearch,
    callGoogleApiNearBySearch
} from "./service/googleApi/placeService";
import {responseDetailResult} from "./dataStruct/response/detailResponses";
import {isFavoriteByUserId} from "./service/placeService";
import {googleImageListConvertPhotoId} from "./service/imageService";
import {userDocument} from "./dataStruct/mongodb/userDocument";
import {ObjectId} from "mongodb";
import {latLngItem} from "./dataStruct/pubilcItem";
import {googlePlaceResult} from "./dataStruct/originalGoogleResponse/placeResponse";
import {googleDetailItem} from "./dataStruct/originalGoogleResponse/detailResponse";

async function updateCustom(location: latLngItem, distance: number, keyword: string) {
    if (isUndefined([location, distance, keyword])) throwError(errorCodes.requestDataError);
    let resultStatus = {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };
    for (const type of config.foodTypeList) {
        let result = await nearBySearch(3, {
            location, type, keyword, distance
        }, "custom");
        resultStatus.upsertCount += result.upsertCount;
        resultStatus.matchCount += result.matchCount;
        resultStatus.modifiedCount += result.modifiedCount;
    }
    return resultStatus;
}

async function updatePlaceByDistance(location: latLngItem, searchPageNum: number = 1) {
    if (isUndefined([location])) throwError(errorCodes.requestDataError);
    let resultStatus = {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };
    for (const type of config.foodTypeList) {
        let result = await nearBySearch(searchPageNum, {
                location, type, keyword: "", distance: -1
            }, "search_by_near"
        );
        resultStatus.upsertCount += result.upsertCount;
        resultStatus.matchCount += result.matchCount;
        resultStatus.modifiedCount += result.modifiedCount;
    }
    return resultStatus;
}

async function updatePlaceByKeyword(location: latLngItem, keyword: string, distance: number, searchPageNum: number = 1) {
    if (isUndefined([location, keyword, distance])) throwError(errorCodes.requestDataError);
    let resultStatus = {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };
    for (const type of config.foodTypeList) {
        let result = await nearBySearch(searchPageNum, {
                location, type, keyword, distance
            }, "search_by_keyword"
        );
        resultStatus.upsertCount += result.upsertCount;
        resultStatus.matchCount += result.matchCount;
        resultStatus.modifiedCount += result.modifiedCount;
    }
    return resultStatus;
}

// https://developers.google.com/maps/documentation/places/web-service/search-nearby
async function nearBySearch(searchPageNum: number, request: { location: latLngItem; type: string; keyword: string; distance: number; }, msg: string = "") {
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let requestTime: Date = new Date();
    let {location, type, keyword, distance} = request;
    let googlePlaceList: googlePlaceResult[] = keyword === "" ?
        await callGoogleApiNearBySearch(searchPageNum, location, type, distance) :
        await callGoogleApiKeywordBySearch(searchPageNum, location, type, keyword, distance);
    let dbPlaceDocumentList: dbPlaceDocument[] = await Promise.all(googlePlaceList.map(async (googlePlace: googlePlaceResult): Promise<dbPlaceDocument> => {
        let dbPlace: dbPlaceItem = {
            updateTime: new Date(),
            place_id: googlePlace.place_id || '',
            status: googlePlace.business_status || '',
            name: googlePlace.name || '',
            photos: await googleImageListConvertPhotoId(googlePlace.photos),
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
            opening_hours: googlePlace.opening_hours ?? {}
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

export default {
    updateCustom,
    updatePlaceByDistance,
    updatePlaceByKeyword,
};
