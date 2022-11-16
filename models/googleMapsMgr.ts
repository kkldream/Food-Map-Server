import axios from 'axios';
import mongoClient from './mongodbMgr';

const API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function updateRestaurant(latitude: number, longitude: number, radius: number) {
    let dataList: any[] = [];
    let next_page_token: string = "";
    let requestCount: number;
    for (requestCount = 1; requestCount <= 3; requestCount++) {
        let response = await axios({
            method: 'get',
            url: `${API_URL}?pagetoken=${next_page_token}&location=${latitude},${longitude}&radius=${radius}&type=restaurant&language=zh-TW&key=${GOOGLE_API_KEY}`
        });
        dataList = dataList.concat(response.data.results);
        next_page_token = response.data.next_page_token;
        console.log(`updateRestaurant: +${response.data.results.length}/${dataList.length}, next_page = ${next_page_token !== undefined}`)
        if (!next_page_token) break;
        await new Promise((r) => setTimeout(r, 2000));
    }

    for (let i = 0; i < dataList.length; i++) {
        const data = dataList[i];
        dataList[i] = {
            updateTime: new Date(),
            uid: data.place_id,
            status: data.business_status || "",
            name: data.name,
            photos: data.photos || [],
            rating: {
                star: data.rating,
                total: data.user_ratings_total,
            },
            address: data.vicinity,
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
        const restaurantCol = mdb.collection('restaurant');
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
        let result = await restaurantCol.bulkWrite(bulkWritePipe);
        let dbStatus = {
            matchCount: result.nMatched,
            upsertCount: result.nUpserted
        };
        // insert update log
        await updateLogCol.insertOne({
            createTime: new Date(),
            type: 'search_by_near',
            request: {
                location: mongoClient.convert2dSphere(latitude, longitude),
                radius
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
    updateRestaurant
};
