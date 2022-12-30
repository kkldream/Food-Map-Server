import axios from "axios";
import {insertGoogleApiGeocodeAutocompleteLog} from "../googleApiLogService";
import {latLngItem} from "../../dataStruct/pubilcItem";

// https://developers.google.com/maps/documentation/geocoding/start#reverse
export async function callGoogleApiGeocodeAddress(location: latLngItem): Promise<any> {
    let url = 'https://maps.google.com/maps/api/geocode/json?'
        + `&latlng=${location.lat},${location.lng}`
        + `&sensor=true`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&language=zh-TW`;
    let response: any = (await axios({method: 'get', url})).data;
    await insertGoogleApiGeocodeAutocompleteLog({location, response});
    return response;
}

// https://developers.google.com/maps/documentation/geocoding/start#geocoding-request-and-response-latitudelongitude-lookup
export async function callGoogleApiGeocodeLocation(address: string): Promise<any> {
    let url = 'https://maps.googleapis.com/maps/api/geocode/json?'
        + `&address=${address}`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&language=zh-TW`;
    let response: any = (await axios({method: 'get', url})).data;
    await insertGoogleApiGeocodeAutocompleteLog({address, response});
    return response;
}