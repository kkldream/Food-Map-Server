import {googleStatusEnum} from "./pubilcItem";

export interface googleAutocompleteResponse {
    predictions: placeAutocompletePrediction[];
    status: googleStatusEnum;
    error_message?: string;
    info_messages?: string[];
}

export interface placeAutocompletePrediction {
    description: string;
    matched_substrings: placeAutocompleteMatchedSubstring[];
    structured_formatting: placeAutocompleteStructuredFormat;
    terms: placeAutocompleteTerm[];
    distance_meters: number;
    place_id: string;
    types: string[];
}

interface placeAutocompleteStructuredFormat {
    main_text: string;
    main_text_matched_substrings: placeAutocompleteMatchedSubstring[];
    secondary_text: string;
    secondary_text_matched_substrings: placeAutocompleteMatchedSubstring[];
}

interface placeAutocompleteMatchedSubstring {
    length: number;
    offset: number;
}

interface placeAutocompleteTerm {
    offset: number;
    value: string;
}
