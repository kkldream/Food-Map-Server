import {errorCodes, isUndefined, throwError} from './dataStruct/throwError';
import {responseAutocompleteItem, responseAutocompleteResult} from "./dataStruct/response/autocompleteResponses";
import {callGoogleApiAutocomplete} from "./service/googleApi/placeService";
import {
    callGoogleApiComputeRoutes,
    callGoogleApiGeocodeAddress,
    callGoogleApiGeocodeLocation,
    waypoint
} from "./service/googleApi/geocodeService";
import {
    googleAutocompleteResponse,
    placeAutocompletePrediction
} from "./dataStruct/originalGoogleResponse/autocompleteResponse";
import {latLngItem} from "./dataStruct/pubilcItem";
import {
    addressComponents,
    googleGeocodeAutocompleteResponse,
    googleGeocodeAutocompleteResult,
    typesEnum
} from "./dataStruct/originalGoogleResponse/geocodeAutocompleteResponse";
import {getLocationByAddressResult} from "./dataStruct/response/getLocationByAddressResponses";
import {getRoutePolylineResponse} from "./dataStruct/response/getRoutePolylineResponse";
import {computeRoutesResponse} from "./dataStruct/originalGoogleResponse/computeRoutesResponse";
import {getAutocompleteHistory} from "./service/placeService";
import {getGeocodeAutocompleteHistory} from "./service/geocodeService";

async function autocomplete(location: latLngItem, input: string | undefined): Promise<responseAutocompleteResult> {
    if (isUndefined([location])) throwError(errorCodes.requestDataError);
    let updated = false;
    let outputList: responseAutocompleteItem[] = [];
    if (input) {
        let predictions: placeAutocompletePrediction[] = await getAutocompleteHistory(location, input, 1, undefined, 10);
        if (predictions.length === 0) {
            let response: googleAutocompleteResponse = await callGoogleApiAutocomplete(input, location, undefined, 1);
            updated = true;
            predictions = response.predictions;
        }
        outputList = predictions.map((item: placeAutocompletePrediction): responseAutocompleteItem => {
            return {
                place_id: item.place_id,
                name: item.structured_formatting.main_text,
                address: item.structured_formatting.secondary_text,
                description: item.description
            };
        });
    } else {
        let historyResult: googleGeocodeAutocompleteResult[] = await getGeocodeAutocompleteHistory(location);
        if (historyResult.length === 0) {
            let response: googleGeocodeAutocompleteResponse = await callGoogleApiGeocodeAddress(location);
            updated = true;
            historyResult = response.results;
        }
        let item = historyResult[0];
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
        updated,
        placeCount: outputList.length,
        placeList: outputList
    };
}

async function getLocationByAddress(address: string): Promise<getLocationByAddressResult> {
    if (isUndefined([address])) throwError(errorCodes.requestDataError);
    let updated = false;
    let historyResult: googleGeocodeAutocompleteResult[] = await getGeocodeAutocompleteHistory(address);
    if (historyResult.length === 0) {
        let response: googleGeocodeAutocompleteResponse = await callGoogleApiGeocodeLocation(address);
        updated = true;
        historyResult = response.results;
    }
    let item = historyResult[0];
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
    return {updated, place: output};
}

async function getRoutePolyline(origin: waypoint, destination: waypoint): Promise<getRoutePolylineResponse> {
    let response: computeRoutesResponse = await callGoogleApiComputeRoutes(origin, destination);
    return {
        updated: true,
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
