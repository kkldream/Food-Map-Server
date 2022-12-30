import googleMapsMgr from "./googleMapsMgr";
import {ObjectId} from 'mongodb';
import {errorCodes, isUndefined, throwError} from './dataStruct/throwError';
import config from "../config"
import {drawCardModeEnum} from "./dataStruct/staticCode/drawCardModeEnum";
import {dbPlaceDocument, dbPlaceItem} from "./dataStruct/mongodb/googlePlaceDocument";
import {responsePlaceItem, responsePlaceResult} from "./dataStruct/response/placeResponses";
import {userDocument} from "./dataStruct/mongodb/userDocument";
import {getBlackList} from "./service/blackListService";
import {photoDocument} from "./dataStruct/mongodb/photoDocument";
import {photoResult} from "./dataStruct/response/photoResponse";
import {responseAutocompleteItem} from "./dataStruct/response/autocompleteResponses";
import {callGoogleApiAutocomplete, callGoogleApiDetail} from "./service/googleApi/placeService";
import {googlePlaceResult} from "./dataStruct/originalGoogleResponse/placeResponse";
import {foodTypeEnum} from "./dataStruct/staticCode/foodTypeEnum";
import {googleApiLogDocument} from "./dataStruct/mongodb/googleApiLogDocument";
import {responseLocationConvertDb, twoLocateDistance} from "./utils";
import {
    googleAutocompleteResponse,
    placeAutocompletePrediction
} from "./dataStruct/originalGoogleResponse/autocompleteResponse";
import {latLngItem} from "./dataStruct/pubilcItem";
import {dbPlaceDocumentWithDistance, dbPlaceListConvertResponse, isFavoriteByUserId} from "./service/placeService";
import {responseDetailResult} from "./dataStruct/response/detailResponses";
import {googleDetailItem} from "./dataStruct/originalGoogleResponse/detailResponse";
import {googleImageListConvertPhotoId} from "./service/imageService";

async function searchByDistance(userId: string, location: latLngItem, distance: number, skip: number, limit: number): Promise<responsePlaceResult> {
    if (isUndefined([userId, location, distance, skip, limit])) throwError(errorCodes.requestDataError);
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let updated = false;
    let dbStatus: any;
    let pipeline: any = [
        {
            "$geoNear": {
                "near": responseLocationConvertDb(location),
                "distanceField": "distance",
                "spherical": true,
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
    if (distance !== -1) pipeline[0]["$geoNear"]["maxDistance"] = distance;
    let placeCountResult = await placeCol.aggregate([pipeline[0], {"$count": "count"}]).toArray();
    let placeCount = placeCountResult.length !== 0 ? placeCountResult[0].count : 0;
    if (placeCount < config.minResponseCount) {
        dbStatus = await googleMapsMgr.updatePlaceByDistance(location);
        updated = true;
    }
    let dbPlaceDocList: dbPlaceDocumentWithDistance[] = await placeCol.aggregate(pipeline).toArray();
    let responsePlaceList: responsePlaceItem[] = await dbPlaceListConvertResponse(dbPlaceDocList, userId);
    return {updated, dbStatus, placeCount, placeList: responsePlaceList}
}

async function searchByKeyword(userId: string, location: latLngItem, distance: number, keyword: string, skip: number, limit: number): Promise<responsePlaceResult> {
    if (isUndefined([userId, location, distance, keyword, skip, limit])) throwError(errorCodes.requestDataError);
    const requestTime = new Date();
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
    let updated = false;
    let dbStatus: any;
    const options = {allowDiskUse: false};
    let pipeline: any[] = [
        {
            "$geoNear": {
                "near": responseLocationConvertDb(location),
                "distanceField": "distance",
                "spherical": true,
                "maxDistance": 100,
                "query": {
                    "mode": "place",
                    "createTime": {"$gte": new Date(requestTime.setSeconds(-config.keywordUpdateRangeSecond))}
                }
            }
        },
        {"$sort": {"createTime": -1}},
        {"$limit": 1}
    ];
    if (distance === -1) pipeline[0]["$geoNear"].query["request.rankby"] = "distance";
    else pipeline[0]["$geoNear"].query["request.radius"] = distance;
    let findResult: googleApiLogDocument[] = await googleApiLogCol.aggregate(pipeline, options).toArray();
    if (findResult.length === 0) {
        dbStatus = await googleMapsMgr.updatePlaceByKeyword(location, keyword, distance);
        updated = true;
        findResult = await googleApiLogCol.aggregate(pipeline, options).toArray();
    }
    let googlePlaceList: googlePlaceResult[] = findResult[0].response.data as googlePlaceResult[];
    let googlePlaceIdList: string[] = googlePlaceList.map(googlePlace => googlePlace.place_id);
    let dbPlaceDocList: dbPlaceDocument[] = await placeCol.find({place_id: {$in: googlePlaceIdList}}).toArray();
    let dbPlaceDocWithDistanceList: dbPlaceDocumentWithDistance[] = dbPlaceDocList.map((dbPlaceDoc: dbPlaceDocument): dbPlaceDocumentWithDistance => ({
        ...dbPlaceDoc,
        distance: twoLocateDistance(location, dbPlaceDoc.content.location)
    })).sort((a: dbPlaceDocumentWithDistance, b: dbPlaceDocumentWithDistance) => {
        if (a.distance > b.distance) return 1;
        if (a.distance < b.distance) return -1;
        return 0;
    });
    let responsePlaceList: responsePlaceItem[] = await dbPlaceListConvertResponse(dbPlaceDocWithDistanceList, userId);
    return {updated, dbStatus, placeCount: responsePlaceList.length, placeList: responsePlaceList};
}

// https://developers.google.com/maps/documentation/places/web-service/details
async function detailsByPlaceId(userId: string, place_id: string): Promise<responseDetailResult> {
    if (isUndefined([place_id])) throwError(errorCodes.requestDataError);
    let requestTime: Date = new Date();
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let findResult: dbPlaceDocument = await placeCol.findOne({place_id});
    let updated = false;
    if (!findResult) {
        let detailResult: googleDetailItem = (await callGoogleApiDetail(place_id)).result;
        if (!detailResult) throwError(errorCodes.placeNotFound);
        findResult = {
            creatTime: requestTime,
            updateTime: requestTime,
            place_id: detailResult.place_id,
            location: responseLocationConvertDb(detailResult.geometry.location),
            types: detailResult.types,
            name: detailResult.name,
            content: {
                updateTime: requestTime,
                place_id: detailResult.place_id,
                status: detailResult.business_status,
                name: detailResult.name,
                photos: await googleImageListConvertPhotoId(detailResult.photos),
                rating: {
                    star: detailResult.rating,
                    total: detailResult.user_ratings_total,
                },
                address: detailResult.vicinity,
                location: detailResult.geometry.location,
                icon: {
                    url: detailResult.icon,
                    background_color: detailResult.icon_background_color,
                    mask_base_uri: detailResult.icon_mask_base_uri,
                },
                types: detailResult.types,
                opening_hours: detailResult.opening_hours ?? {}
            },
            originalPlace: null,
            originalDetail: detailResult
        };
        await placeCol.insertOne(findResult);
        updated = true;
    }
    if (findResult.originalDetail === null || requestTime.getTime() - (findResult.originalDetail.updateTime?.getTime() ?? 0) > config.detailUpdateRangeSecond * 1000) {
        findResult.originalDetail = (await callGoogleApiDetail(place_id)).result;
        findResult.originalDetail.updateTime = requestTime;
        let content: dbPlaceItem = {
            updateTime: requestTime,
            place_id: findResult.originalDetail.place_id,
            status: findResult.originalDetail.business_status,
            name: findResult.originalDetail.name,
            photos: await googleImageListConvertPhotoId(findResult.originalDetail.photos),
            rating: {
                star: findResult.originalDetail.rating,
                total: findResult.originalDetail.user_ratings_total,
            },
            address: findResult.originalDetail.vicinity,
            location: findResult.originalDetail.geometry.location,
            icon: {
                url: findResult.originalDetail.icon,
                background_color: findResult.originalDetail.icon_background_color,
                mask_base_uri: findResult.originalDetail.icon_mask_base_uri,
            },
            types: findResult.originalDetail.types,
            opening_hours: findResult.originalDetail.opening_hours ?? {}
        };
        await placeCol.updateOne({place_id}, {
            $set: {
                updateTime: requestTime, content,
                originalDetail: findResult.originalDetail
            }
        });
        updated = true;
    }
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    return {
        updated,
        isFavorite: await isFavoriteByUserId(userId, place_id),
        updateTime: findResult.originalDetail.updateTime ?? requestTime,
        place: {
            opening_hours: {
                open_now: findResult.originalDetail.current_opening_hours?.open_now ?? false,
                weekday_text: findResult.originalDetail.current_opening_hours?.weekday_text ?? []
            },
            delivery: findResult.originalDetail.delivery,
            dine_in: findResult.originalDetail.dine_in,
            address: findResult.originalDetail.formatted_address,
            phone: findResult.originalDetail.formatted_phone_number,
            location: findResult.originalDetail.geometry.location,
            name: findResult.originalDetail.name,
            photos: await googleImageListConvertPhotoId(findResult.originalDetail.photos),
            place_id: findResult.originalDetail.place_id,
            price_level: findResult.originalDetail.price_level,
            rating: findResult.originalDetail.rating,
            reviews: findResult.originalDetail.reviews,
            takeout: findResult.originalDetail.takeout,
            url: findResult.originalDetail.url,
            ratings_total: findResult.originalDetail.user_ratings_total,
            vicinity: findResult.originalDetail.vicinity,
            website: findResult.originalDetail.website
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
    let dbStatus: any;
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

async function autocomplete(location: latLngItem, input: string, distance: number = -1): Promise<responseAutocompleteItem[]> {
    if (isUndefined([location, input])) throwError(errorCodes.requestDataError);
    let outputList: responseAutocompleteItem[] = [];
    await Promise.all(config.foodTypeList.map(async (type: foodTypeEnum) => {
        let response: googleAutocompleteResponse = await callGoogleApiAutocomplete(
            input, location, type, distance === -1 ? "distance" : distance
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
    // 前端白癡要求
    outputList = [{place_id: "", name: input, address: "", description: ""}].concat(outputList);
    outputList[0].isSearch = true;
    return outputList;
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
