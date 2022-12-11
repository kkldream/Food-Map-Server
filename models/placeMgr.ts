import googleMapsMgr from "./googleMapsMgr";
import {BSONRegExp, ObjectId} from 'mongodb';
import {errorCodes, isUndefined, throwError} from './dataStruct/throwError';
import config from "../config"
import {drawCardModeEnum} from "./dataStruct/staticCode/drawCardModeEnum";
import {dbPlaceDocument, dbPlaceItem} from "./dataStruct/mongodb/googlePlaceDocument";
import {responsePlaceItem, responsePlaceResult} from "./dataStruct/response/placeResponses";
import {userDocument} from "./dataStruct/mongodb/userDocument";

const FOOD_TYPE_LIST = config.foodTypeList;
const MIN_RESPONSE_COUNT = config.minResponseCount;
const DRAW_CARD_PARAMETER = config.drawCard;

async function dbPlaceListConvertResponse(placeList: dbPlaceItem[], userId: string): Promise<responsePlaceItem[]> {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    let favoriteIdList: string[] = userDoc.favoriteList;
    return placeList.map((place: dbPlaceItem): responsePlaceItem => ({
        updateTime: place.updateTime,
        uid: place.place_id,
        status: place.status,
        name: place.name,
        photos: place.photos,
        rating: place.rating,
        address: place.address,
        location: place.location,
        icon: place.icon,
        types: place.types,
        opening_hours: place.opening_hours,
        isFavorite: favoriteIdList.includes(place.place_id)
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
                "near": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "distanceField": "distance",
                "spherical": true,
                "maxDistance": distance,
                "query": {"types": {"$in": FOOD_TYPE_LIST}}
            }
        },
        {"$sort": {"distance": 1}},
        {"$skip": skip},
        {"$limit": limit}
    ];
    let placeCountResult = await placeCol.aggregate([pipeline[0], {"$count": "count"}]).toArray();
    let placeCount = placeCountResult.length !== 0 ? placeCountResult[0].count : 0;
    if (placeCount < MIN_RESPONSE_COUNT) {
        dbStatus = await googleMapsMgr.updatePlaceByDistance(latitude, longitude);
        updated = true;
    }
    let dbPlaceDocList: dbPlaceDocument[] = await placeCol.aggregate(pipeline).toArray();
    let dbPlaceList: dbPlaceItem[] = dbPlaceDocList.map((dbPlaceDoc: dbPlaceDocument) => dbPlaceDoc.content);
    let responsePlaceList: responsePlaceItem[] = await dbPlaceListConvertResponse(dbPlaceList, userId);
    return {updated, dbStatus, placeCount, placeList: responsePlaceList}
}

async function searchByKeyword(userId: string, latitude: number, longitude: number, keyword: string, skip: number, limit: number): Promise<responsePlaceResult> {
    if (isUndefined([userId, latitude, longitude, keyword, skip, limit])) throwError(errorCodes.requestDataError);
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let updated = false;
    let dbStatus: any;
    let pipeline = [
        {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "distanceField": "distance",
                "spherical": true,
                "query": {
                    "$and": [
                        {"name": {"$regex": new BSONRegExp(keyword)}},
                        {"types": {"$in": FOOD_TYPE_LIST}}
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
    if (placeCount < MIN_RESPONSE_COUNT) {
        dbStatus = await googleMapsMgr.updatePlaceByKeyword(latitude, longitude, keyword);
        updated = true;
    }
    let dbPlaceDocList: dbPlaceDocument[] = await placeCol.aggregate(pipeline).toArray();
    let dbPlaceList: dbPlaceItem[] = dbPlaceDocList.map((dbPlaceDoc: dbPlaceDocument) => dbPlaceDoc.content);
    let responsePlaceList: responsePlaceItem[] = await dbPlaceListConvertResponse(dbPlaceList, userId);
    return {updated, dbStatus, placeCount, placeList: responsePlaceList}
}

// 先隨機取幾個，之後會改成依距離判斷
async function drawCard(userId: string, latitude: number, longitude: number, mode: drawCardModeEnum, num: number) {
    if (isUndefined([userId, latitude, longitude, mode, num])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let placeList: any[];
    switch (mode) {
        case drawCardModeEnum.favorite:
            let favoriteList = (await userCol.findOne({_id: new ObjectId(userId)})).favoriteList;
            if (!favoriteList) return {msg: '無最愛紀錄'};
            let favoriteIdList = favoriteList.map((favorite: any) => favorite.placeId).slice(0, num);
            placeList = await placeCol.aggregate([
                {$match: {$and: [{uid: {$in: favoriteIdList}}, {types: {$in: FOOD_TYPE_LIST}}]}},
                {$sample: {size: num}}
            ]).toArray();
            break;
        case drawCardModeEnum.near:
            placeList = await placeCol.aggregate([
                {
                    "$geoNear": {
                        "near": {"type": "Point", "coordinates": [longitude, latitude]},
                        "distanceField": "distance",
                        "spherical": true,
                        "maxDistance": DRAW_CARD_PARAMETER.maxDistance,
                        "query": {
                            "$and": [
                                {"types": {"$in": FOOD_TYPE_LIST}},
                                {"rating.star": {"$gte": DRAW_CARD_PARAMETER.ratingStar}},
                                {"rating.total": {"$gte": DRAW_CARD_PARAMETER.ratingTotal}}
                            ]
                        }
                    }
                },
                {$sample: {size: num}}
            ]).toArray();
            break;
    }
    placeList = await dbPlaceListConvertResponse(placeList, userId);
    return {placeCount: placeList.length, placeList};
}

export default {
    searchByDistance,
    searchByKeyword,
    drawCard
};
