import axios from "axios";
import {insertGoogleApiGeocodeAutocompleteLog} from "../googleApiLogService";
import {latLngItem} from "../../dataStruct/pubilcItem";
import {googleGeocodeAutocompleteResponse} from "../../dataStruct/originalGoogleResponse/geocodeAutocompleteResponse";

// https://developers.google.com/maps/documentation/geocoding/start#reverse
export async function callGoogleApiGeocodeAddress(location: latLngItem): Promise<googleGeocodeAutocompleteResponse> {
    let url = 'https://maps.google.com/maps/api/geocode/json?'
        + `&latlng=${location.lat},${location.lng}`
        + `&sensor=true`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&language=zh-TW`;
    let response: googleGeocodeAutocompleteResponse = (await axios({method: 'get', url})).data;
    insertGoogleApiGeocodeAutocompleteLog({location, response: response.results});
    return response;
}

// https://developers.google.com/maps/documentation/geocoding/start#geocoding-request-and-response-latitudelongitude-lookup
export async function callGoogleApiGeocodeLocation(address: string): Promise<googleGeocodeAutocompleteResponse> {
    let url = 'https://maps.googleapis.com/maps/api/geocode/json?'
        + `&address=${address}`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&language=zh-TW`;
    let response: googleGeocodeAutocompleteResponse = (await axios({method: 'get', url})).data;
    insertGoogleApiGeocodeAutocompleteLog({address, response: response.results});
    return response;
}