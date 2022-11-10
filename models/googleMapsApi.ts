const axios = require('axios');
const db = require('./dbMgr');

const API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function updateRestaurant(latitude: Number, longitude: Number, radius: Number) {
    let response = await axios({
        method: 'get',
        url: `${API_URL}?location=${latitude},${longitude}&radius=${radius}&type=restaurant&language=zh-TW&key=${GOOGLE_API_KEY}`
    });
    let dataList = response.data.results;
    let next_page_token = response.data.next_page_token;
    while (next_page_token) {
        let response = await axios({
            method: 'get',
            url: `${API_URL}?pagetoken=${next_page_token}&key=${GOOGLE_API_KEY}`
        });
        dataList = dataList.concat(response.data.results);
        next_page_token = response.data.next_page_token;
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
            location: {
                "type" : "Point",
                "coordinates" : [data.geometry.location.lng, data.geometry.location.lat]
            },
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
    return await db.exec('restaurant', async (col: any) => {
        await col.deleteMany({});
        return await col.insertMany(dataList);
    });
}

module.exports = {
    updateRestaurant
};
