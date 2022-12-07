import googleMapsMgr from "./googleMapsMgr";
import {BSONRegExp, ObjectId} from 'mongodb';
import {throwError, errorCodes, isUndefined} from './dataStruct/throwError';
import config from "../config"
import {drawCardModeEnum} from "./dataStruct/staticCode/drawCardModeEnum";
import {favoriteItem} from "./dataStruct/mongodb/userDocument";
import googlePlaceDocument from "./dataStruct/mongodb/googlePlaceDocument";

const FOOD_TYPE_LIST = config.foodTypeList;
const MIN_RESPONSE_COUNT = config.minResponseCount;
const DRAW_CARD_PARAMETER = config.drawCard;

async function placeListConvertOutput(placeList: googlePlaceDocument[], userId: string) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc = await userCol.findOne({_id: new ObjectId(userId)});
    let favoriteIdList: string[] = userDoc.favoriteList ? userDoc.favoriteList.map((favorite: favoriteItem) => favorite.placeId) : [];
    placeList.map((place: any) => {
        delete place._id;
        place.location = {
            lat: place.location.coordinates[1],
            lng: place.location.coordinates[0]
        };
        place.isFavorite = favoriteIdList.includes(place.uid);
    })
    return placeList;
}

async function searchByDistance(userId: string, latitude: number, longitude: number, distance: number, skip: number, limit: number) {
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
    let placeCount = (await placeCol.aggregate([pipeline[0], {"$count": "count"}]).toArray())[0].count;
    if (placeCount < MIN_RESPONSE_COUNT) {
        dbStatus = await googleMapsMgr.updatePlaceByDistance(latitude, longitude);
        updated = true;
    }
    let placeList = await placeCol.aggregate(pipeline).toArray();
    placeList = await placeListConvertOutput(placeList, userId);
    return {updated, dbStatus, placeCount, placeList}
}

async function searchByKeyword(userId: string, latitude: number, longitude: number, keyword: string, skip: number, limit: number) {
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
    let placeList = await placeCol.aggregate(pipeline).toArray();
    placeList = await placeListConvertOutput(placeList, userId);
    return {updated, dbStatus, placeCount, placeList};
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
    placeList = await placeListConvertOutput(placeList, userId);
    return {placeCount: placeList.length, placeList};
}

export default {
    searchByDistance,
    searchByKeyword,
    drawCard
};
