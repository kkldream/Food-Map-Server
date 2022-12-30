import {latLngLiteral} from "../../dataStruct/mongodb/originalGooglePlaceData";
import axios from "axios";

export async function callGoogleApiGeocodeAddress(location: latLngLiteral): Promise<any> {
    let url = 'https://maps.google.com/maps/api/geocode/json?'
        + `&latlng=${location.lat},${location.lng}`
        + `&sensor=true`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&language=zh-TW`;
    let response: any = (await axios({method: 'get', url})).data;
    // await insertGoogleApiAutocompleteLog({
    //     input, type, radius, response: response.predictions,
    //     location: responseLocationConvertDb(location)
    // });
    return response;
}

export async function callGoogleApiGeocodeLocation(address: string): Promise<any> {
    let url = 'https://maps.googleapis.com/maps/api/geocode/json?'
        + `&address=${address}`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&language=zh-TW`;
    let response: any = (await axios({method: 'get', url})).data;
    // await insertGoogleApiAutocompleteLog({
    //     input, type, radius, response: response.predictions,
    //     location: responseLocationConvertDb(location)
    // });
    return response;
}