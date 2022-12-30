export interface googleAutocompleteResponse {
    predictions: placeAutocompletePrediction[];
    status: string;
    error_message?: string;
    info_messages?: string[];
}

export interface placeAutocompletePrediction {
    description: string;
    matched_substrings: placeAutocompleteMatchedSubstring[];
    structured_formatting: placeAutocompleteStructuredFormat ;
    terms: placeAutocompleteTerm[];
    distance_meters: number;
    place_id: string;
    types: string[];
}

interface placeAutocompleteMatchedSubstring {
    length: number;
    offset: number;
}

interface placeAutocompleteStructuredFormat  {
    main_text: string;
    main_text_matched_substrings: placeAutocompleteMatchedSubstring[];
    secondary_text: string;
    secondary_text_matched_substrings: placeAutocompleteMatchedSubstring[];
}

interface placeAutocompleteTerm {
    offset: number;
    value: string;
}
