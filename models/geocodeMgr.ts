import {errorCodes, isUndefined, throwError} from './dataStruct/throwError';
import {responseAutocompleteItem} from "./dataStruct/response/autocompleteResponses";
import {callGoogleApiAutocomplete} from "./service/googleApi/placeService";
import {googleAutocompleteResponse, placeAutocompletePrediction} from "./dataStruct/mongodb/originalGooglePlaceData";
import {callGoogleApiGeocodeAddress, callGoogleApiGeocodeLocation} from "./service/googleApi/geocodeService";

async function autocomplete(latitude: number, longitude: number, input: string | undefined): Promise<responseAutocompleteItem[]> {
    if (isUndefined([latitude, longitude])) throwError(errorCodes.requestDataError);
    if (input) {
        let response: googleAutocompleteResponse = await callGoogleApiAutocomplete(
            input, {lat: latitude, lng: longitude}, undefined, "distance"
        );
        return response.predictions.map((item: placeAutocompletePrediction): responseAutocompleteItem => {
            return {
                place_id: item.place_id,
                name: item.structured_formatting.main_text,
                address: item.structured_formatting.secondary_text,
                description: item.description
            };
        });
    } else {
        let response: any = await callGoogleApiGeocodeAddress({lat: latitude, lng: longitude});
        let item = response.results[0];
        return [{
            place_id: item.place_id,
            name: item.address_components
                .filter((e: any) => e.types.includes("political") && !e.types.includes("country"))
                .reverse()
                .map((e: any) => e.long_name)
                .join(""),
            address: item.formatted_address,
            description: item.formatted_address,
            location: {lat: latitude, lng: longitude}
        }];
    }
}

async function getLocationByAddress(address: string): Promise<responseAutocompleteItem> {
    let response: any = await callGoogleApiGeocodeLocation(address);
    let item = response.results[0];
    return {
        place_id: item.place_id,
        name: item.address_components
            .filter((e: any) => e.types.includes("political") && !e.types.includes("country"))
            .reverse()
            .map((e: any) => e.long_name)
            .join(""),
        address: item.formatted_address,
        description: item.formatted_address,
        location: item.geometry.location
    };
}

export default {
    autocomplete,
    getLocationByAddress,
};
