import axios from 'axios';
import {throwError, errorCodes, isUndefined} from "./dataStruct/throwError";
import utils from "./utils";
import config from "../config"
import placeDocument from "./dataStruct/mongodb/placeDocument";
import {ObjectId} from "mongodb";
import {favoriteItem} from "./dataStruct/mongodb/userDocument";

// https://developers.google.com/maps/documentation/places/web-service/supported_types
const FOOD_TYPE_LIST = config.foodTypeList;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function updateCustom(latitude: number, longitude: number, radius: number, keyword: string) {
    if (!latitude || !longitude || !radius || !keyword) throwError(errorCodes.requestDataError);
    let resultStatus = {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };
    for (const type of FOOD_TYPE_LIST) {
        let result = await nearBySearch(3, {latitude, longitude, radius, keyword}, "custom");
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
                latitude, longitude,
                radius: -1,
                type,
                keyword: ''
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
                latitude, longitude,
                type,
                keyword
            }, "search_by_keyword"
        );
        resultStatus.upsertCount += result.upsertCount;
        resultStatus.matchCount += result.matchCount;
        resultStatus.modifiedCount += result.modifiedCount;
    }
    return resultStatus;
}

// https://developers.google.com/maps/documentation/places/web-service/search-nearby
async function nearBySearch(searchPageNum: number, request: any, msg: string = "") {
    let {latitude, longitude, radius, type, keyword} = request
    const placeCol = global.mongodbClient.foodMapDb.placeCol;
    const updateLogCol = global.mongodbClient.foodMapDb.updateLogCol;
    let dataList: placeDocument[] = [];
    let next_page_token: string = '';
    let requestCount: number;
    for (requestCount = 1; requestCount <= searchPageNum; requestCount++) {
        if (requestCount > 1) await new Promise((r) => setTimeout(r, 1000));
        let url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
            + `&language=zh-TW`
            + `&key=${GOOGLE_API_KEY}`
            + `&pagetoken=${next_page_token}`
            + `&location=${latitude},${longitude}`
            + `&type=${type}`;
        if (keyword !== '') {
            url += `&keyword=${keyword}`;
            url += `&rankby=distance`;
        } else {
            if (radius === -1) url += `&rankby=distance`;
            else url += `&radius=${radius}`;
        }
        let response = await axios({method: 'get', url});
        dataList = dataList.concat(response.data.results);
        next_page_token = response.data.next_page_token;
        console.log(`update ${type}: +${response.data.results.length}/${dataList.length}, next_page = ${next_page_token !== undefined}`)
        if (!next_page_token) break;
    }

    if (dataList.length === 0) return {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };

    for (let i = 0; i < dataList.length; i++) {
        const data: any = dataList[i];
        dataList[i] = {
            updateTime: new Date(),
            uid: data.place_id || '',
            status: data.business_status || '',
            name: data.name || '',
            photos: data.photos || [],
            rating: {
                star: data.rating || 0,
                total: data.user_ratings_total || 0,
            },
            address: data.vicinity || '',
            location: utils.converTo2dSphere(data.geometry.location.lat, data.geometry.location.lng),
            icon: {
                url: data.icon,
                background_color: data.icon_background_color,
                mask_base_uri: data.icon_mask_base_uri,
            },
            types: data.types,
            opening_hours: {
                periods: data.opening_hours?.periods || [],
                special_days: data.opening_hours?.special_days || [],
                type: data.opening_hours?.type || "",
                weekday_text: data.opening_hours?.weekday_text || "",
            }
        }
    }

    // 更新DB資料
    let bulkWritePipe = []
    let dataIdList = []
    for (const data of dataList) {
        dataIdList.push(data.uid);
        bulkWritePipe.push({
            updateOne: {
                filter: {uid: data.uid},
                update: {$set: data},
                upsert: true
            }
        });
    }
    let result = await placeCol.bulkWrite(bulkWritePipe);
    let dbStatus = {
        upsertCount: result.nUpserted,
        matchCount: result.nMatched,
        modifiedCount: result.nModified
    };
    // insert update log
    await updateLogCol.insertOne({
        createTime: new Date(),
        type: msg,
        request: {
            location: utils.converTo2dSphere(latitude, longitude),
            radius, type, keyword
        },
        requestCount,
        response: dataList,
        responseCount: dataList.length,
        googleApiKey: GOOGLE_API_KEY,
        dbStatus
    });
    return dbStatus;
}

// https://developers.google.com/maps/documentation/places/web-service/details
async function detailsByPlaceId(userId: string, place_id: string) {
    if (isUndefined([place_id])) throwError(errorCodes.requestDataError);
    const userCol = global.mongodbClient.foodMapDb.userCol;
    let url = 'https://maps.googleapis.com/maps/api/place/details/json?'
        + `&language=zh-TW`
        + `&place_id=${place_id}`
        + `&key=${GOOGLE_API_KEY}`;
    let response = (await axios({method: 'get', url})).data;
    let userDoc = await userCol.findOne({_id: new ObjectId(userId)});
    let favoriteIdList: string[] = userDoc.favoriteList ? userDoc.favoriteList.map((favorite: favoriteItem) => favorite.placeId) : [];
    response.isFavorite = favoriteIdList.includes(place_id);
    return response;
}

export default {
    updateCustom,
    updatePlaceByDistance,
    updatePlaceByKeyword,
    detailsByPlaceId
};
