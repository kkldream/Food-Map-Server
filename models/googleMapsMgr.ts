import axios from 'axios';
import mongoClient from './mongodbMgr';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// https://developers.google.com/maps/documentation/places/web-service/supported_types
const TYPE_LIST = ['cafe', 'food', 'restaurant', 'meal_takeaway'];

async function updateCustom(latitude: number, longitude: number, radius: number, keyword: string) {
    for (const argument of arguments) if (argument === undefined) throw {status: 5, msg: '請求內容錯誤'};
    let resultStatus = {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };
    for (const type of TYPE_LIST) {
        let result = await nearBySearch(3, {latitude, longitude, radius, keyword});
        resultStatus.upsertCount += result.upsertCount;
        resultStatus.matchCount += result.matchCount;
        resultStatus.modifiedCount += result.modifiedCount;
    }
    return resultStatus;
}

async function updatePlaceByDistance(latitude: number, longitude: number, searchPageNum: number = 1) {
    for (const argument of arguments) if (argument === undefined) throw {status: 5, msg: '請求內容錯誤'};
    let resultStatus = {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };
    for (const type of TYPE_LIST) {
        let result = await nearBySearch(searchPageNum, {
                latitude, longitude,
                radius: -1,
                type,
                keyword: ''
            }
        );
        resultStatus.upsertCount += result.upsertCount;
        resultStatus.matchCount += result.matchCount;
        resultStatus.modifiedCount += result.modifiedCount;
    }
    return resultStatus;
}

async function updatePlaceByKeyword(latitude: number, longitude: number, keyword: string, searchPageNum: number = 1) {
    for (const argument of arguments) if (argument === undefined) throw {status: 5, msg: '請求內容錯誤'};
    let resultStatus = {
        upsertCount: 0,
        matchCount: 0,
        modifiedCount: 0
    };
    for (const type of TYPE_LIST) {
        let result = await nearBySearch(searchPageNum, {
                latitude, longitude,
                type,
                keyword
            }
        );
        resultStatus.upsertCount += result.upsertCount;
        resultStatus.matchCount += result.matchCount;
        resultStatus.modifiedCount += result.modifiedCount;
    }
    return resultStatus;
}

// https://developers.google.com/maps/documentation/places/web-service/search-nearby
async function nearBySearch(searchPageNum: number, request: any) {
    let {latitude, longitude, radius, type, keyword} = request
    let dataList: any[] = [];
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
        const data = dataList[i];
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
            location: mongoClient.convert2dSphere(data.geometry.location.lat, data.geometry.location.lng),
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
    return await mongoClient.exec(async (mdb: any) => {
        const updateLogCol = mdb.collection('updateLog');
        const placeCol = mdb.collection('place');
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
            type: 'search_by_near',
            request: {
                location: mongoClient.convert2dSphere(latitude, longitude),
                radius, type, keyword
            },
            requestCount,
            response: dataList,
            responseCount: dataList.length,
            googleApiKey: GOOGLE_API_KEY,
            dbStatus
        });
        return dbStatus;
    });
}

export default {
    updateCustom,
    updatePlaceByDistance,
    updatePlaceByKeyword
};
