import googleMapsMgr from "./googleMapsMgr";
import {BSONRegExp, ObjectId} from 'mongodb';
import {errorCodes, isUndefined, throwError} from './dataStruct/throwError';
import config from "../config"
import {drawCardModeEnum} from "./dataStruct/staticCode/drawCardModeEnum";
import {dbPlaceDocument} from "./dataStruct/mongodb/googlePlaceDocument";
import {responsePlaceItem, responsePlaceResult} from "./dataStruct/response/placeResponses";
import {userDocument} from "./dataStruct/mongodb/userDocument";
import {getBlackList} from "./service/blackListService";
import {photoDocument} from "./dataStruct/mongodb/photoDocument";
import {photoResult} from "./dataStruct/response/photoResponse";

interface dbPlaceDocumentWithDistance extends dbPlaceDocument {
    distance: number;
}

async function dbPlaceListConvertResponse(dbPlaceDocList: dbPlaceDocumentWithDistance[], userId: string): Promise<responsePlaceItem[]> {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    let favoriteIdList: string[] = userDoc.favoriteList;
    return dbPlaceDocList.map((dbPlaceDoc: dbPlaceDocumentWithDistance): responsePlaceItem => ({
        updateTime: dbPlaceDoc.content.updateTime,
        place_id: dbPlaceDoc.place_id,
        status: dbPlaceDoc.content.status,
        name: dbPlaceDoc.content.name,
        photos: dbPlaceDoc.content.photos,
        rating: dbPlaceDoc.content.rating,
        address: dbPlaceDoc.content.address,
        location: dbPlaceDoc.content.location,
        icon: dbPlaceDoc.content.icon,
        types: dbPlaceDoc.content.types,
        opening_hours: dbPlaceDoc.content.opening_hours,
        distance: dbPlaceDoc.distance,
        isFavorite: favoriteIdList.includes(dbPlaceDoc.place_id)
    }));
}

async function searchByDistance(userId: string, latitude: number, longitude: number, distance: number, skip: number, limit: number): Promise<responsePlaceResult> {
    if (isUndefined([userId, latitude, longitude, distance, skip, limit])) throwError(errorCodes.requestDataError);
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let updated = false;
    let dbStatus: any;
    let pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": [longitude, latitude]},
                "distanceField": "distance",
                "spherical": true,
                "maxDistance": distance,
                "query": {
                    "$and": [
                        {"types": {"$in": config.foodTypeList}},
                        {"place_id": {"$nin": await getBlackList()}}
                    ]
                }
            }
        },
        {"$sort": {"distance": 1}},
        {"$skip": skip},
        {"$limit": limit}
    ];
    let placeCountResult = await placeCol.aggregate([pipeline[0], {"$count": "count"}]).toArray();
    let placeCount = placeCountResult.length !== 0 ? placeCountResult[0].count : 0;
    if (placeCount < config.minResponseCount) {
        dbStatus = await googleMapsMgr.updatePlaceByDistance(latitude, longitude);
        updated = true;
    }
    let dbPlaceDocList: dbPlaceDocumentWithDistance[] = await placeCol.aggregate(pipeline).toArray();
    let responsePlaceList: responsePlaceItem[] = await dbPlaceListConvertResponse(dbPlaceDocList, userId);
    return {updated, dbStatus, placeCount: responsePlaceList.length, placeList: responsePlaceList}
}

async function searchByKeyword(userId: string, latitude: number, longitude: number, keyword: string, skip: number, limit: number): Promise<responsePlaceResult> {
    if (isUndefined([userId, latitude, longitude, keyword, skip, limit])) throwError(errorCodes.requestDataError);
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let updated = false;
    let dbStatus: any;
    let pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": [longitude, latitude]},
                "distanceField": "distance",
                "spherical": true,
                "query": {
                    "$and": [
                        {"name": {"$regex": new BSONRegExp(keyword)}},
                        {"types": {"$in": config.foodTypeList}},
                        {"place_id": {"$nin": await getBlackList()}}
                    ]
                }
            }
        },
        {"$sort": {"distance": 1}},
        {"$skip": skip},
        {"$limit": limit}
    ];
    let placeCount = await placeCol.aggregate([pipeline[0], {"$count": "count"}]).toArray();
    placeCount = placeCount.length === 0 ? 0 : placeCount[0].count;
    if (placeCount < config.minResponseCount) {
        dbStatus = await googleMapsMgr.updatePlaceByKeyword(latitude, longitude, keyword);
        updated = true;
    }
    let dbPlaceDocList: dbPlaceDocumentWithDistance[] = await placeCol.aggregate(pipeline).toArray();
    let responsePlaceList: responsePlaceItem[] = await dbPlaceListConvertResponse(dbPlaceDocList, userId);
    return {updated, dbStatus, placeCount: responsePlaceList.length, placeList: responsePlaceList}
}

async function drawCard(userId: string, latitude: number, longitude: number, mode: drawCardModeEnum, num: number): Promise<responsePlaceResult> {
    if (isUndefined([userId, latitude, longitude, mode, num])) throwError(errorCodes.requestDataError);
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
                        "near": {"type": "Point", "coordinates": [longitude, latitude]},
                        "distanceField": "distance",
                        "spherical": true,
                        "maxDistance": config.drawCard.maxDistance,
                        "query": {
                            "$and": [
                                {"types": {"$in": config.foodTypeList}},
                                {"content.rating.star": {"$gte": config.drawCard.ratingStar}},
                                {"content.rating.total": {"$gte": config.drawCard.ratingTotal}},
                                {"place_id": {"$nin": await getBlackList()}}
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
                dbStatus = await googleMapsMgr.updatePlaceByDistance(latitude, longitude);
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

export default {
    searchByDistance,
    searchByKeyword,
    drawCard,
    getPhoto,
    getHtmlPhoto,
};
