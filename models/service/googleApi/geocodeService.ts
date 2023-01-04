import axios from "axios";
import {insertGoogleApiComputeRoutesLog, insertGoogleApiGeocodeAutocompleteLog} from "../googleApiLogService";
import {latLngItem} from "../../dataStruct/pubilcItem";
import {googleGeocodeAutocompleteResponse} from "../../dataStruct/originalGoogleResponse/geocodeAutocompleteResponse";
import {computeRoutesResponse} from "../../dataStruct/originalGoogleResponse/computeRoutesResponse";
import {
    googleRoutesApiRequest,
    routeTravelModeEnum,
    waypointByLocation,
    waypointByPlaceId
} from "../../dataStruct/request/googleRoutesApiRequest";

// https://developers.google.com/maps/documentation/geocoding/start#reverse
export async function callGoogleApiGeocodeAddress(location: latLngItem): Promise<googleGeocodeAutocompleteResponse> {
    let url = 'https://maps.google.com/maps/api/geocode/json?'
        + `&latlng=${location.lat},${location.lng}`
        + `&sensor=true`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&language=zh-TW`;
    let response: googleGeocodeAutocompleteResponse = (await axios({method: 'get', url})).data;
    await insertGoogleApiGeocodeAutocompleteLog({location, response: response.results});
    return response;
}

// https://developers.google.com/maps/documentation/geocoding/start#geocoding-request-and-response-latitudelongitude-lookup
export async function callGoogleApiGeocodeLocation(address: string): Promise<googleGeocodeAutocompleteResponse> {
    let url = 'https://maps.googleapis.com/maps/api/geocode/json?'
        + `&address=${address}`
        + `&key=${process.env.GOOGLE_API_KEY}`
        + `&language=zh-TW`;
    let response: googleGeocodeAutocompleteResponse = (await axios({method: 'get', url})).data;
    await insertGoogleApiGeocodeAutocompleteLog({address, response: response.results});
    return response;
}

export interface waypoint extends latLngItem, waypointByPlaceId {

}
// https://developers.google.com/maps/documentation/routes/specify_location
export async function callGoogleApiComputeRoutes(origin: waypoint, destination: waypoint): Promise<computeRoutesResponse> {
    let config = {
        method: "post",
        url: "https://routes.googleapis.com/directions/v2:computeRoutes",
        headers: {
            "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
            "Content-Type": "application/json"
        },
        data: ({
            origin: origin.place_id !== "" ? ({place_id: origin.place_id} as waypointByPlaceId) :
                ({location: {latLng: {latitude: origin.lat, longitude: origin.lng}}} as waypointByLocation),
            destination: destination.place_id !== "" ? ({place_id: destination.place_id} as waypointByPlaceId) :
                ({location: {latLng: {latitude: destination.lat, longitude: destination.lat}}} as waypointByLocation),
            travelMode: routeTravelModeEnum.WALK,
            computeAlternativeRoutes: false,
            routeModifiers: {avoidIndoor: false},
            languageCode: "zh-TW"
        } as googleRoutesApiRequest)
    };
    let response: computeRoutesResponse = (await axios(config)).data;
    await insertGoogleApiComputeRoutesLog({request: config.data, response});
    return response;
}
