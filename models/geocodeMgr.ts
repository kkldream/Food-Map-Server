import {errorCodes, isUndefined, throwError} from './dataStruct/throwError';
import {responseAutocompleteItem} from "./dataStruct/response/autocompleteResponses";
import {callGoogleApiAutocomplete} from "./service/googleApi/placeService";
import {callGoogleApiGeocodeAddress, callGoogleApiGeocodeLocation} from "./service/googleApi/geocodeService";
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

async function autocomplete(location: latLngItem, input: string | undefined): Promise<responseAutocompleteItem[]> {
    if (isUndefined([location])) throwError(errorCodes.requestDataError);
    if (input) {
        let response: googleAutocompleteResponse = await callGoogleApiAutocomplete(
            input, location, undefined, "distance"
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
        let response: googleGeocodeAutocompleteResponse = await callGoogleApiGeocodeAddress(location);
        let item = response.results[0];
        return [{
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
}

async function getLocationByAddress(address: string): Promise<responseAutocompleteItem> {
    let response: googleGeocodeAutocompleteResponse = await callGoogleApiGeocodeLocation(address);
    let item = response.results[0];
    return {
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
}

export default {
    autocomplete,
    getLocationByAddress,
};
