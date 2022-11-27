import googleMapsMgr from "./googleMapsMgr";
import {BSONRegExp} from 'mongodb';
import {throwError, errorCodes, isUndefined} from './dataStruct/throwError';
import config from "../config"
import {drawCardModeEnum} from "./dataStruct/staticCode/drawCardModeEnum";

const FOOD_TYPE_LIST = config.foodTypeList;
const MIN_RESPONSE_NUM: number = 1;
const MAX_RESPONSE_NUM: number = 20;

async function searchByDistance(latitude: number, longitude: number, distance: number, minNum: number = MIN_RESPONSE_NUM, maxNum: number = MAX_RESPONSE_NUM) {
    if (!latitude || !longitude || !distance || maxNum < minNum || maxNum === 0) throwError(errorCodes.requestDataError);
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
        {
            "$sort": {
                "distance": 1,
                "rating.star": -1,
                "rating.total": -1,
                "name": 1
            }
        },
        {
            "$limit": maxNum
        }
    ];
    let placeList = await placeCol.aggregate(pipeline).toArray();
    if (placeList.length < minNum) {
        dbStatus = await googleMapsMgr.updatePlaceByDistance(latitude, longitude);
        updated = true;
        placeList = await placeCol.aggregate(pipeline).toArray();
    }
    for (const place of placeList) {
        place.location = {
            lat: place.location.coordinates[1],
            lng: place.location.coordinates[0]
        }
    }
    return {updated, dbStatus, placeCount: placeList.length, placeList};
}

async function searchByKeyword(latitude: number, longitude: number, keyword: string, minNum: number = MIN_RESPONSE_NUM, maxNum: number = MAX_RESPONSE_NUM) {
    if (isUndefined([latitude, longitude, keyword]) || maxNum < minNum || maxNum === 0) throwError(errorCodes.requestDataError);
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
        {
            "$sort": {
                "distance": 1,
                "rating.star": -1,
                "rating.total": -1,
                "name": 1
            }
        },
        {
            "$limit": maxNum
        }
    ];
    let placeList = await placeCol.aggregate(pipeline).toArray();
    if (placeList.length < minNum) {
        dbStatus = await googleMapsMgr.updatePlaceByKeyword(latitude, longitude, keyword);
        updated = true;
        placeList = await placeCol.aggregate(pipeline).toArray();
    }
    for (const place of placeList) {
        place.location = {
            lat: place.location.coordinates[1],
            lng: place.location.coordinates[0]
        }
    }
    return {updated, dbStatus, placeCount: placeList.length, placeList};
}

async function drawCard(userId: string, latitude: number, longitude: number, mode: drawCardModeEnum, num: number) {
    if (isUndefined([userId, latitude, longitude, mode, num])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    switch (mode) {
        case drawCardModeEnum.favorite:

            break;
        case drawCardModeEnum.near:
            break;
    }
    return 'TBD';
}

export default {
    searchByDistance,
    searchByKeyword,
    drawCard
};
