import googleMapsMgr from "./googleMapsMgr";
import {ObjectId} from 'mongodb';
import {errorCodes, isUndefined, throwError} from './dataStruct/throwError';
import config from "../config"
import {drawCardModeEnum} from "./dataStruct/staticCode/drawCardModeEnum";
import {dbPlaceDocument} from "./dataStruct/mongodb/googlePlaceDocument";
import {responsePlaceItem, responsePlaceResult} from "./dataStruct/response/placeResponses";
import {userDocument} from "./dataStruct/mongodb/userDocument";
import {getBlackList} from "./service/blackListService";
import {photoDocument} from "./dataStruct/mongodb/photoDocument";
import {photoResult} from "./dataStruct/response/photoResponse";
import {responseAutocompleteItem, responseAutocompleteResult} from "./dataStruct/response/autocompleteResponses";
import {
    callGoogleApiAutocomplete,
    callGoogleApiDetail, getSearchByKeywordHistory,
    isSearchByDistanceHaveHistory
} from "./service/googleApi/placeService";
import {googlePlaceResult} from "./dataStruct/originalGoogleResponse/placeResponse";
import {foodTypeEnum} from "./dataStruct/staticCode/foodTypeEnum";
import {googleApiLogDocument} from "./dataStruct/mongodb/googleApiLogDocument";
import {responseLocationConvertDb, twoLocateDistance} from "./utils";
import {
    googleAutocompleteResponse,
    placeAutocompletePrediction
} from "./dataStruct/originalGoogleResponse/autocompleteResponse";
import {latLngItem} from "./dataStruct/pubilcItem";
import {
    dbPlaceDocumentWithDistance,
    dbPlaceListConvertResponse,
    detailToDocument,
    isFavoriteByUserId
} from "./service/placeService";
import {responseDetailResult} from "./dataStruct/response/detailResponses";
import {googleDetailItem} from "./dataStruct/originalGoogleResponse/detailResponse";
import {googleImageListConvertPhotoId} from "./service/imageService";
import {dbStatus} from "./dataStruct/originalGoogleResponse/pubilcItem";

/**
 * 使用經緯度搜尋附近餐廳
 * @param userId
 * @param location
 * @param distance
 * @param skip
 * @param limit
 */
async function searchByDistance(userId: string, location: latLngItem, distance: number, skip: number, limit: number): Promise<responsePlaceResult> {
    if (isUndefined([userId, location, distance, skip, limit])) throwError(errorCodes.requestDataError);
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let updated = false;
    let dbStatus: dbStatus | undefined;
    // 若此地區近期無搜尋紀錄則更新
    if (!await isSearchByDistanceHaveHistory(location)) {
        dbStatus = await googleMapsMgr.updatePlaceByDistance(location);
        updated = true;
    }
    // 從placeCol取得資料
    let pipeline: any = [
        {
            "$geoNear": {
                "near": responseLocationConvertDb(location),
                "distanceField": "distance",
                "spherical": true,
                "maxDistance": distance <= 0 ? 30000 : distance,
                "query": {
                    "$and": [
                        {"types": {"$in": config.foodTypeList}},
                        {"place_id": {"$nin": await getBlackList(userId)}}
                    ]
                }
            }
        },
        {"$sort": {"distance": 1}},
        {"$skip": skip},
        {"$limit": limit}
    ];
    let placeCount: number = (await placeCol.aggregate([pipeline[0], {"$count": "count"}]).toArray())[0].count ?? 0;
    let dbPlaceDocList: dbPlaceDocumentWithDistance[] = await placeCol.aggregate(pipeline).toArray();
    let responsePlaceList: responsePlaceItem[] = await dbPlaceListConvertResponse(dbPlaceDocList, userId);
    return {updated, dbStatus, placeCount, placeList: responsePlaceList};
}

/**
 * 使用關鍵字搜尋附近餐廳，因關鍵字搜尋法本地無法實現，所以資料都從以前呼叫過的API紀錄獲取。
 * @param userId
 * @param location
 * @param distance
 * @param keyword
 * @param skip
 * @param limit
 */
async function searchByKeyword(userId: string, location: latLngItem, distance: number, keyword: string, skip: number, limit: number): Promise<responsePlaceResult> {
    if (isUndefined([userId, location, distance, keyword, skip, limit])) throwError(errorCodes.requestDataError);
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let updated = false;
    let dbStatus: dbStatus | undefined;
    // 取得此地區近期的關鍵字搜尋紀錄
    let googlePlaceList: googlePlaceResult[] = await getSearchByKeywordHistory(location, distance, keyword);
    // 若無紀錄則更新
    if (googlePlaceList.length === 0) {
        dbStatus = await googleMapsMgr.updatePlaceByKeyword(location, keyword, distance);
        updated = true;
        googlePlaceList = await getSearchByKeywordHistory(location, distance, keyword);
    }
    let placeCount: number = googlePlaceList.length;
    let googlePlaceIdList: string[] = googlePlaceList.map(googlePlace => googlePlace.place_id);
    let dbPlaceDocList: dbPlaceDocument[] = await placeCol
        .find({place_id: {$in: googlePlaceIdList}})
        .skip(skip).limit(limit).toArray();
    let dbPlaceDocWithDistanceList: dbPlaceDocumentWithDistance[] = dbPlaceDocList.map((dbPlaceDoc: dbPlaceDocument): dbPlaceDocumentWithDistance => ({
        ...dbPlaceDoc, distance: twoLocateDistance(location, dbPlaceDoc.content.location)
    })).sort((a: dbPlaceDocumentWithDistance, b: dbPlaceDocumentWithDistance) => {
        if (a.distance > b.distance) return 1;
        if (a.distance < b.distance) return -1;
        return 0;
    });
    let responsePlaceList: responsePlaceItem[] = await dbPlaceListConvertResponse(dbPlaceDocWithDistanceList, userId);
    return {updated, dbStatus, placeCount, placeList: responsePlaceList};
}

/**
 * 使用place_id取得餐廳詳細資料
 * @param userId
 * @param place_id
 */
async function detailsByPlaceId(userId: string, place_id: string): Promise<responseDetailResult> {
    if (isUndefined([place_id])) throwError(errorCodes.requestDataError);
    let requestTime: Date = new Date();
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let findResult: dbPlaceDocument = await placeCol.findOne({
        place_id, updateTime: {$gt: new Date(requestTime.setSeconds(-config.detailUpdateRangeSecond))}
    });
    let updated = false;
    if (!findResult || findResult.originalDetail === null) {
        let detailResult: googleDetailItem = (await callGoogleApiDetail(place_id)).result;
        if (!detailResult) throwError(errorCodes.placeNotFound);
        findResult = await detailToDocument(requestTime, detailResult);
        await placeCol.updateOne({place_id}, {$set: findResult}, {upsert: true});
        updated = true;
    }
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    let originalDetail: googleDetailItem = findResult.originalDetail as googleDetailItem;
    return {
        updated,
        isFavorite: await isFavoriteByUserId(userId, place_id),
        updateTime: findResult.updateTime ?? requestTime,
        place: {
            opening_hours: {
                open_now: originalDetail.current_opening_hours?.open_now ?? false,
                weekday_text: originalDetail.current_opening_hours?.weekday_text ?? []
            },
            delivery: originalDetail.delivery,
            dine_in: originalDetail.dine_in,
            address: originalDetail.formatted_address,
            phone: originalDetail.formatted_phone_number,
            location: originalDetail.geometry.location,
            name: originalDetail.name,
            photos: await googleImageListConvertPhotoId(originalDetail.photos),
            place_id: originalDetail.place_id,
            price_level: originalDetail.price_level,
            rating: originalDetail.rating,
            reviews: originalDetail.reviews,
            takeout: originalDetail.takeout,
            url: originalDetail.url,
            ratings_total: originalDetail.user_ratings_total,
            vicinity: originalDetail.vicinity,
            website: originalDetail.website
        },
        isBlackList: userDoc.blackList.includes(place_id)
    };
}

async function drawCard(userId: string, location: latLngItem, mode: drawCardModeEnum, num: number): Promise<responsePlaceResult> {
    if (isUndefined([userId, location, mode, num])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let placeList: dbPlaceDocumentWithDistance[] = [];
    let updated = false;
    let dbStatus: dbStatus | undefined;
    switch (mode) {
        case drawCardModeEnum.near:
            let pipeline = [
                {
                    "$geoNear": {
                        "near": responseLocationConvertDb(location),
                        "distanceField": "distance",
                        "spherical": true,
                        "maxDistance": config.drawCard.maxDistance,
                        "query": {
                            "$and": [
                                {"types": {"$in": config.foodTypeList}},
                                {"content.rating.star": {"$gte": config.drawCard.ratingStar}},
                                {"content.rating.total": {"$gte": config.drawCard.ratingTotal}},
                                {"place_id": {"$nin": await getBlackList(userId)}}
                            ]
                        }
                    }
                },
                {"$sample": {"size": num}},
                {"$sort": {"distance": 1}}
            ];
            let placeCountResult = await placeCol.aggregate([pipeline[0], {"$count": "count"}]).toArray();
            let placeCount = placeCountResult.length !== 0 ? placeCountResult[0].count : 0;
            if (placeCount < config.minResponseCount) {
                dbStatus = await googleMapsMgr.updatePlaceByDistance(location);
                updated = true;
            }
            placeList = await placeCol.aggregate(pipeline).toArray();
            break;
        case drawCardModeEnum.favorite:
            let favoriteIdList: string[] = (await userCol.findOne({_id: new ObjectId(userId)})).favoriteList;
            if (favoriteIdList.length === 0) break;
            placeList = await placeCol.aggregate([
                {$match: {$and: [{place_id: {$in: favoriteIdList}}, {types: {$in: config.foodTypeList}}]}},
                {$sample: {size: num}}
            ]).toArray();
            break;
    }
    let responsePlaceList: responsePlaceItem[] = await dbPlaceListConvertResponse(placeList, userId);
    return {updated, placeCount: responsePlaceList.length, placeList: responsePlaceList};
}

async function getPhoto(photoId: string, detail: boolean = false): Promise<photoResult> {
    if (isUndefined([photoId])) throwError(errorCodes.requestDataError);
    const photoCol = global.mongodbClient.foodMapDb.photoCol;
    let photoDoc: photoDocument = await photoCol.findOne({_id: new ObjectId(photoId)});
    if (!photoDoc) throwError(errorCodes.photoNotFound);
    return {
        updateTime: photoDoc.updateTime,
        photo_reference: detail ? photoDoc.photo_reference : undefined,
        uploadUser: detail ? photoDoc.uploadUser : undefined,
        width: photoDoc.width,
        height: photoDoc.height,
        data: photoDoc.data,
        length: photoDoc.length,
        format: photoDoc.format
    };
}

async function getHtmlPhoto(photoId: string): Promise<string> {
    if (isUndefined([photoId])) throwError(errorCodes.requestDataError);
    const photoCol = global.mongodbClient.foodMapDb.photoCol;
    let photoDoc: photoDocument = await photoCol.findOne({_id: new ObjectId(photoId)});
    if (!photoDoc) throwError(errorCodes.photoNotFound);
    return photoDoc.data;
}

async function autocomplete(location: latLngItem, input: string, distance: number): Promise<responseAutocompleteResult> {
    if (isUndefined([location, input])) throwError(errorCodes.requestDataError);
    let outputList: responseAutocompleteItem[] = [];
    await Promise.all(config.foodTypeList.map(async (type: foodTypeEnum) => {
        let response: googleAutocompleteResponse = await callGoogleApiAutocomplete(
            input, location, type, distance === -1 ? 1 : distance
        );
        let output: responseAutocompleteItem[] = response.predictions.map((item: placeAutocompletePrediction): responseAutocompleteItem => ({
            place_id: item.place_id,
            name: item.structured_formatting.main_text,
            address: item.structured_formatting.secondary_text,
            description: item.description,
            isSearch: true,
        }));
        outputList = outputList.concat(output);
    }));
    let set = new Set();
    outputList = outputList.filter(item => !set.has(item.place_id) ? set.add(item.place_id) : false);
    // 前端小帥要求
    outputList = [{place_id: "", name: input, address: "", description: ""}].concat(outputList);
    outputList[0].isSearch = true;
    return {
        updated: true,
        dbStatus: undefined,
        placeCount: outputList.length,
        placeList: outputList
    };
}

export default {
    searchByDistance,
    searchByKeyword,
    detailsByPlaceId,
    drawCard,
    getPhoto,
    getHtmlPhoto,
    autocomplete,
};
