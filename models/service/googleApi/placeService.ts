import {googlePlaceResponse, googlePlaceResult} from "../../dataStruct/originalGoogleResponse/placeResponse";
import axios from "axios";
import {
    insertGoogleApiAutocompleteLog,
    insertGoogleApiDetailLog,
    insertGoogleApiPlaceLog
} from "../googleApiLogService";
import {googleAutocompleteResponse} from "../../dataStruct/originalGoogleResponse/autocompleteResponse";
import {latLngItem} from "../../dataStruct/pubilcItem";
import {googleDetailResponse} from "../../dataStruct/originalGoogleResponse/detailResponse";
import {googleStatusEnum} from "../../dataStruct/originalGoogleResponse/pubilcItem";
import {errorCodes, throwError} from "../../dataStruct/throwError";

function assertGoogleStatus(status: googleStatusEnum, errorMessage?: string) {
    if (status === googleStatusEnum.OK || status === googleStatusEnum.ZERO_RESULTS) return;

    throwError(
        errorCodes.unknown,
        `Google Places API 錯誤: ${status}${errorMessage ? ` - ${errorMessage}` : ""}`
    );
}

function handleGoogleAxiosError(error: unknown): never {
    if (axios.isAxiosError(error)) {
        const googleResponse = error.response?.data as {status?: googleStatusEnum; error_message?: string} | undefined;
        if (googleResponse?.status) {
            assertGoogleStatus(googleResponse.status, googleResponse.error_message);
        }
        throwError(errorCodes.unknown, error.message);
    }

    throw error;
}

async function fetchPlacesPage(url: string, pageToken?: string): Promise<googlePlaceResponse> {
    for (let attempt = 0; attempt < 3; attempt++) {
        let response: googlePlaceResponse = (await axios({method: 'get', url})).data;

        if (pageToken && response.status === googleStatusEnum.INVALID_REQUEST && attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
        }

        assertGoogleStatus(response.status, response.error_message);
        return response;
    }

    throwError(errorCodes.unknown, 'Google Places API 錯誤: INVALID_REQUEST - next_page_token 尚未生效');
}

// https://developers.google.com/maps/documentation/places/web-service/search-nearby
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
            + (distance <= 0 ? "&rankby=distance" : `&radius=${distance}`)
            + "&components=country:tw";
        let response: googlePlaceResponse = await fetchPlacesPage(url, next_page_token || undefined);
        originalDataList = originalDataList.concat(response.results);
        next_page_token = response.next_page_token;
        console.log(`update ${type}: +${response.results.length}/${originalDataList.length}, next_page = ${next_page_token !== undefined}`)
        if (!next_page_token) break;
    }
    await insertGoogleApiPlaceLog({
        searchPageNum, type, distance, location, response: originalDataList
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
        + (distance <= 0 ? "&rankby=distance" : `&radius=${distance}`)
        + "&components=country:tw";
    let response: googlePlaceResponse = await fetchPlacesPage(url);
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
            let response: googlePlaceResponse = await fetchPlacesPage(url, next_page_token);
            originalDataList = originalDataList.concat(response.results);
            next_page_token = response.next_page_token;
            console.log(`update ${type}: +${response.results.length}/${originalDataList.length}, next_page = ${next_page_token !== undefined}`)
            if (!next_page_token) break;
        }
    })
    await insertGoogleApiPlaceLog({
        searchPageNum, type, keyword, distance, location, response: originalDataList
    });
    return originalDataList;
}

// https://developers.google.com/maps/documentation/places/web-service/details
export async function callGoogleApiDetail(place_id: string): Promise<googleDetailResponse> {
    let url = 'https://maps.googleapis.com/maps/api/place/details/json?'
        + `&language=zh-TW`
        + `&place_id=${place_id}`
        + `&key=${process.env.GOOGLE_API_KEY}`;
    let response: googleDetailResponse = (await axios({method: 'get', url})).data;
    assertGoogleStatus(response.status, response.error_message);
    await insertGoogleApiDetailLog({place_id, response: response.result});
    return response;
}

// https://developers.google.com/maps/documentation/places/web-service/autocomplete
/**
 *
 * @param input
 * @param location
 * @param type
 * @param distance 單位公尺，預設為30000，範圍大於等於1
 */
export async function callGoogleApiAutocomplete(input: string, location: latLngItem, type: string | undefined, distance: number = 30000): Promise<googleAutocompleteResponse> {
    try {
        const response: googleAutocompleteResponse = (await axios({
            method: 'get',
            url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
            params: {
                input,
                location: `${location.lat},${location.lng}`,
                components: 'country:tw',
                radius: distance,
                key: process.env.GOOGLE_API_KEY,
                language: 'zh-TW',
                ...(type ? {types: type} : {})
            }
        })).data;
        assertGoogleStatus(response.status, response.error_message);
        await insertGoogleApiAutocompleteLog({
            input, type, distance, response: response.predictions, location
        });
        return response;
    } catch (error) {
        handleGoogleAxiosError(error);
    }
}
