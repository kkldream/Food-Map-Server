import {baseResponses} from "./baseResponse";

export interface autocompleteResponses extends baseResponses{
    result: responseAutocompleteItem[];
}

export interface responseAutocompleteItem {
    place_id: string;
    name: string;
    address: string;
}
