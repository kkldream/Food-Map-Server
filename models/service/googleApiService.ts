import {
    googleAutocompleteResponse,
    googleDetailResponse,
    googlePlaceResponse,
    googlePlaceResult,
    latLngLiteral
} from "../dataStruct/mongodb/originalGooglePlaceData";
import axios from "axios";
import {responseLocationItem} from "../dataStruct/response/publicItem/responseLocationItem";
import {responseLocationConvertDb} from "../utils";
import {insertGoogleApiAutocompleteLog, insertGoogleApiDetailLog, insertGoogleApiPlaceLog} from "./googleApiLogService";

export async function callGoogleApiNearBySearch(searchPageNum: number, location: responseLocationItem, type: string, keyword: string, radius: number): Promise<googlePlaceResult[]> {
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
            + `&type=${type}`;
        if (keyword !== "") {
            url += `&keyword=${keyword}`;
            url += `&rankby=distance`;
        } else {
            if (radius === -1) url += `&rankby=distance`;
            else url += `&radius=${radius}`;
        }
        let response: googlePlaceResponse = (await axios({method: 'get', url})).data;
        originalDataList = originalDataList.concat(response.results);
        next_page_token = response.next_page_token;
        console.log(`update ${type}: +${response.results.length}/${originalDataList.length}, next_page = ${next_page_token !== undefined}`)
        if (!next_page_token) break;
    }
    await insertGoogleApiPlaceLog({
        searchPageNum, type, keyword, radius,
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

export async function callGoogleApiAutocomplete(input: string, location: latLngLiteral, type: string, radius: number | string): Promise<googleAutocompleteResponse> {
    let url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?'
        + `&input=${input}`
        + `&location=${location.lat},${location.lng}`
        + `&components=country:tw`
        + `&radius=${radius}`
        + `&type=${type}`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&language=zh-TW`;
    let response: googleAutocompleteResponse = (await axios({method: 'get', url})).data;
    await insertGoogleApiAutocompleteLog({
        input, type, radius, response: response.predictions,
        location: responseLocationConvertDb(location)
    });
    return response;
}
