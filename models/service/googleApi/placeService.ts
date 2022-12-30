import {googlePlaceResponse, googlePlaceResult} from "../../dataStruct/originalGoogleResponse/placeResponse";
import axios from "axios";
import {responseLocationConvertDb} from "../../utils";
import {
    insertGoogleApiAutocompleteLog,
    insertGoogleApiDetailLog,
    insertGoogleApiPlaceLog
} from "../googleApiLogService";
import {googleAutocompleteResponse} from "../../dataStruct/originalGoogleResponse/autocompleteResponse";
import {latLngItem} from "../../dataStruct/pubilcItem";
import {googleDetailResponse} from "../../dataStruct/originalGoogleResponse/detailResponse";

export async function callGoogleApiNearBySearch(searchPageNum: number, location: latLngItem, type: string, distance: number): Promise<googlePlaceResult[]> {
    let originalDataList: googlePlaceResult[] = [];
    let next_page_token: string = "";
    let requestCount: number;
    for (requestCount = 1; requestCount <= searchPageNum; requestCount++) {
        if (requestCount > 1) await new Promise((r) => setTimeout(r, 1000));
        let url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
            + `&language=zh-TW`
            + `&key=${process.env.GOOGLE_API_KEY}`
            + `&pagetoken=${next_page_token}`
            + `&location=${location.lat},${location.lng}`
            + `&type=${type}`
            + (distance === -1 ? "&rankby=distance" : `&radius=${distance}`)
            + "&components=country:tw";
        let response: googlePlaceResponse = (await axios({method: 'get', url})).data;
        originalDataList = originalDataList.concat(response.results);
        next_page_token = response.next_page_token;
        console.log(`update ${type}: +${response.results.length}/${originalDataList.length}, next_page = ${next_page_token !== undefined}`)
        if (!next_page_token) break;
    }
    await insertGoogleApiPlaceLog({
        searchPageNum, type, distance,
        location: responseLocationConvertDb(location),
        response: originalDataList
    });
    return originalDataList;
}

export async function callGoogleApiKeywordBySearch(searchPageNum: number, location: latLngItem, type: string, keyword: string, distance: number): Promise<googlePlaceResult[]> {
    let url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
        + `&language=zh-TW`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&location=${location.lat},${location.lng}`
        + `&type=${type}`
        + `&keyword=${keyword}`
        + (distance === -1 ? "&rankby=distance" : `&radius=${distance}`)
        + "&components=country:tw";
    let response: googlePlaceResponse = (await axios({method: 'get', url})).data;
    let originalDataList: googlePlaceResult[] = response.results;
    let next_page_token: string | undefined = response.next_page_token;
    console.log(`update ${type}: +${response.results.length}/${originalDataList.length}, next_page = ${next_page_token !== undefined}`);
    new Promise(async () => {
        if (!next_page_token) return;
        for (let requestCount = 0; requestCount < 2; requestCount++) {
            await new Promise((r) => setTimeout(r, 1000));
            let url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
                + `&language=zh-TW`
                + `&key=${process.env.GOOGLE_API_KEY}`
                + `&pagetoken=${next_page_token}`
                + `&location=${location.lat},${location.lng}`
                + `&type=${type}`
                + `&keyword=${keyword}`
                + (distance === -1 ? "&rankby=distance" : `&radius=${distance}`)
                + "&components=country:tw";
            let response: googlePlaceResponse = (await axios({method: 'get', url})).data;
            originalDataList = originalDataList.concat(response.results);
            next_page_token = response.next_page_token;
            console.log(`update ${type}: +${response.results.length}/${originalDataList.length}, next_page = ${next_page_token !== undefined}`)
            if (!next_page_token) break;
        }
    })
    await insertGoogleApiPlaceLog({
        searchPageNum, type, keyword, distance,
        location: responseLocationConvertDb(location),
        response: originalDataList
    });
    return originalDataList;
}

export async function callGoogleApiDetail(place_id: string): Promise<googleDetailResponse> {
    let url = 'https://maps.googleapis.com/maps/api/place/details/json?'
        + `&language=zh-TW`
        + `&place_id=${place_id}`
        + `&key=${process.env.GOOGLE_API_KEY}`;
    let response: googleDetailResponse = (await axios({method: 'get', url})).data;
    await insertGoogleApiDetailLog({place_id, response: response.result});
    return response;
}

export async function callGoogleApiAutocomplete(input: string, location: latLngItem, type: string | undefined, radius: number | string): Promise<googleAutocompleteResponse> {
    let url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?'
        + `&input=${input}`
        + `&location=${location.lat},${location.lng}`
        + `&components=country:tw`
        + `&radius=${radius}`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&language=zh-TW`;
    if (type) url += `&type=${type}`
    let response: googleAutocompleteResponse = (await axios({method: 'get', url})).data;
    await insertGoogleApiAutocompleteLog({
        input, type, radius, response: response.predictions,
        location: responseLocationConvertDb(location)
    });
    return response;
}
