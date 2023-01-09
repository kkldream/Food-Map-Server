import {ObjectId} from "mongodb";
import {userDocument} from "../dataStruct/mongodb/userDocument";
import {responsePlaceItem} from "../dataStruct/response/placeResponses";
import {dbPlaceDocument} from "../dataStruct/mongodb/googlePlaceDocument";
import {googleDetailItem} from "../dataStruct/originalGoogleResponse/detailResponse";
import {responseLocationConvertDb} from "../utils";
import {googleImageListConvertPhotoId} from "./imageService";
import {latLngItem} from "../dataStruct/pubilcItem";
import config from "../../config";
import {googlePlaceResult} from "../dataStruct/originalGoogleResponse/placeResponse";
import {googleApiLogDocument} from "../dataStruct/mongodb/googleApiLogDocument";
import {foodTypeEnum} from "../dataStruct/staticCode/foodTypeEnum";
import {placeAutocompletePrediction} from "../dataStruct/originalGoogleResponse/autocompleteResponse";

export async function isFavoriteByUserId(userId: string, place_id: string) {
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let userDoc: userDocument = await userCol.findOne({_id: new ObjectId(userId)});
    let favoriteIdList: string[] = userDoc.favoriteList;
    return favoriteIdList.includes(place_id);
}

export interface dbPlaceDocumentWithDistance extends dbPlaceDocument {
    distance: number;
}

export async function dbPlaceListConvertResponse(dbPlaceDocList: dbPlaceDocumentWithDistance[], userId: string): Promise<responsePlaceItem[]> {
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

export async function detailToDocument(requestTime: Date, detailItem: googleDetailItem): Promise<dbPlaceDocument> {
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    let findResult: dbPlaceDocument = await placeCol.findOne({place_id: detailItem.place_id});
    return {
        creatTime: findResult ? findResult.creatTime : requestTime,
        updateTime: requestTime,
        place_id: detailItem.place_id,
        location: responseLocationConvertDb(detailItem.geometry.location),
        types: detailItem.types,
        name: detailItem.name,
        content: {
            updateTime: requestTime,
            place_id: detailItem.place_id,
            status: detailItem.business_status,
            name: detailItem.name,
            photos: await googleImageListConvertPhotoId(detailItem.photos),
            rating: {
                star: detailItem.rating,
                total: detailItem.user_ratings_total,
            },
            address: detailItem.vicinity,
            location: detailItem.geometry.location,
            icon: {
                url: detailItem.icon,
                background_color: detailItem.icon_background_color,
                mask_base_uri: detailItem.icon_mask_base_uri,
            },
            types: detailItem.types,
            opening_hours: detailItem.opening_hours ?? findResult.content.opening_hours ?? {}
        },
        originalPlace: findResult ? findResult.originalPlace : null,
        originalDetail: detailItem
    };
}

/**
 * 判斷此地是否有搜尋過
 * @param location
 * @param distance
 */
export async function isSearchByDistanceHaveHistory(location: latLngItem, distance: number = -1): Promise<boolean> {
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
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
                    "createTime": {"$gte": new Date(new Date().setSeconds(-config.reUpdateIntervalSecond))},
                    "request.keyword": null,
                    "request.rankby": distance <= 0 ? "distance" : null,
                    "request.radius": distance <= 0 ? null : distance
                }
            }
        },
        {"$count": "count"}
    ];
    let historyResult: { count: number; }[] = await googleApiLogCol.aggregate(pipeline, options).toArray();
    return historyResult.length > 0;
}

/**
 * 取的近期的關鍵字查詢紀錄
 * @param location
 * @param distance
 * @param keyword
 */
export async function getSearchByKeywordHistory(location: latLngItem, distance: number, keyword: string): Promise<googlePlaceResult[]> {
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
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
                    "createTime": {"$gte": new Date(new Date().setSeconds(-config.reUpdateIntervalSecond))},
                    "request.keyword": keyword,
                    "request.rankby": distance <= 0 ? "distance" : null,
                    "request.radius": distance <= 0 ? null : distance
                }
            }
        },
        {"$sort": {"createTime": -1}},
        {"$limit": 1}
    ];
    let historyResult: googleApiLogDocument[] = await googleApiLogCol.aggregate(pipeline, options).toArray();
    return historyResult.length > 0 ? (historyResult[0].response.data as googlePlaceResult[]) : [];
}

/**
 * 取的近期的Autocomplete查詢紀錄
 * @param location
 * @param input
 * @param distance
 * @param type
 */
export async function getAutocompleteHistory(location: latLngItem, input: string, distance: number, type: foodTypeEnum | undefined, maxDistance: number = 100): Promise<placeAutocompletePrediction[]> {
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
    const options = {allowDiskUse: false};
    let pipeline: any[] = [
        {
            "$geoNear": {
                "near": responseLocationConvertDb(location),
                "distanceField": "distance",
                "spherical": true,
                "maxDistance": maxDistance,
                "query": {
                    "mode": "autocomplete",
                    "createTime": {"$gte": new Date(new Date().setSeconds(-config.reUpdateIntervalSecond))},
                    "request.input": input,
                    "request.radius": distance,
                    "request.type": type
                }
            }
        },
        {"$sort": {"createTime": -1}},
        {"$limit": 1}
    ];
    let historyResult: googleApiLogDocument[] = await googleApiLogCol.aggregate(pipeline, options).toArray();
    if (historyResult.length === 0) return [];
    return historyResult[0].response.data as placeAutocompletePrediction[];
}
