import {responseAutocompleteItem} from "./autocompleteResponses";

export interface getLocationByAddressResult {
    updated: boolean;
    dbStatus?: any;
    place: responseAutocompleteItem;
}
