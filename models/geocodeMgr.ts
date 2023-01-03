import {errorCodes, isUndefined, throwError} from './dataStruct/throwError';
import {responseAutocompleteItem, responseAutocompleteResult} from "./dataStruct/response/autocompleteResponses";
import {callGoogleApiAutocomplete} from "./service/googleApi/placeService";
import {
    callGoogleApiComputeRoutes,
    callGoogleApiGeocodeAddress,
    callGoogleApiGeocodeLocation
} from "./service/googleApi/geocodeService";
import {
    googleAutocompleteResponse,
    placeAutocompletePrediction
} from "./dataStruct/originalGoogleResponse/autocompleteResponse";
import {latLngItem} from "./dataStruct/pubilcItem";
import {
    addressComponents,
    googleGeocodeAutocompleteResponse,
    typesEnum
} from "./dataStruct/originalGoogleResponse/geocodeAutocompleteResponse";
import {getLocationByAddressResult} from "./dataStruct/response/getLocationByAddressResponses";
import {waypointByPlaceId} from "./dataStruct/request/googleRoutesApiRequest";
import {getRoutePolylineResponse} from "./dataStruct/response/getRoutePolylineResponse";
import {computeRoutesResponse} from "./dataStruct/originalGoogleResponse/computeRoutesResponse";

async function autocomplete(location: latLngItem, input: string | undefined): Promise<responseAutocompleteResult> {
    if (isUndefined([location])) throwError(errorCodes.requestDataError);
    let outputList: responseAutocompleteItem[] = [];
    if (input) {
        let response: googleAutocompleteResponse = await callGoogleApiAutocomplete(
            input, location, undefined, -1
        );
        outputList = response.predictions.map((item: placeAutocompletePrediction): responseAutocompleteItem => {
            return {
                place_id: item.place_id,
                name: item.structured_formatting.main_text,
                address: item.structured_formatting.secondary_text,
                description: item.description
            };
        });
    } else {
        let response: googleGeocodeAutocompleteResponse = await callGoogleApiGeocodeAddress(location);
        let item = response.results[0];
        outputList = [{
            place_id: item.place_id,
            name: item.address_components
                .filter((e: addressComponents) => e.types.includes(typesEnum.political) && !e.types.includes(typesEnum.country))
                .reverse()
                .map((e: addressComponents) => e.long_name)
                .join(""),
            address: item.formatted_address,
            description: item.formatted_address,
            location
        }];
    }
    return {
        updated: true,
        dbStatus: undefined,
        placeCount: outputList.length,
        placeList: outputList
    };
}

async function getLocationByAddress(address: string): Promise<getLocationByAddressResult> {
    let response: googleGeocodeAutocompleteResponse = await callGoogleApiGeocodeLocation(address);
    let item = response.results[0];
    let output: responseAutocompleteItem = {
        place_id: item.place_id,
        name: item.address_components
            .filter((e: addressComponents) => e.types.includes(typesEnum.political) && !e.types.includes(typesEnum.country))
            .reverse()
            .map((e: addressComponents) => e.long_name)
            .join(""),
        address: item.formatted_address,
        description: item.formatted_address,
        location: item.geometry.location
    };
    return {
        updated: true,
        dbStatus: undefined,
        place: output
    };
}

async function getRoutePolyline(origin: latLngItem | waypointByPlaceId, destination: latLngItem | waypointByPlaceId): Promise<getRoutePolylineResponse> {
    let response: computeRoutesResponse = await callGoogleApiComputeRoutes(origin, destination);
    return {
        distanceMeters: response.routes[0].distanceMeters,
        duration: parseInt(response.routes[0].duration.replace("s", "")),
        polyline: response.routes[0].polyline.encodedPolyline
    }
}

export default {
    autocomplete,
    getLocationByAddress,
    getRoutePolyline,
};
