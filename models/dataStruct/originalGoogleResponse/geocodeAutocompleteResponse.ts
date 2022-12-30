import {geometry, googleStatusEnum} from "./pubilcItem";

export interface googleGeocodeAutocompleteResponse {
    plus_code?: plusCode;
    results: googleGeocodeAutocompleteResult[];
    status: googleStatusEnum;
}

export interface googleGeocodeAutocompleteResult {
    address_components: addressComponents[];
    formatted_address: string;
    geometry: geometry;
    place_id: string;
    plus_code: plusCode;
    types: typesEnum[];
}

interface plusCode {
    compound_code: string;
    global_code: string;
}

export interface addressComponents {
    long_name: string;
    short_name: string;
    types: typesEnum[];
}

export enum typesEnum {
    street_address = "street_address",
    route = "route",
    intersection = "intersection",
    political = "political",
    country = "country",
    administrative_area_level_1 = "administrative_area_level_1",
    administrative_area_level_2 = "administrative_area_level_2",
    administrative_area_level_3 = "administrative_area_level_3",
    administrative_area_level_4 = "administrative_area_level_4",
    administrative_area_level_5 = "administrative_area_level_5",
    administrative_area_level_6 = "administrative_area_level_6",
    administrative_area_level_7 = "administrative_area_level_7",
    colloquial_area = "colloquial_area",
    locality = "locality",
    sublocality_level_1 = "sublocality_level_1",
    sublocality_level_2 = "sublocality_level_2",
    sublocality_level_3 = "sublocality_level_3",
    sublocality_level_4 = "sublocality_level_4",
    sublocality_level_5 = "sublocality_level_5",
    neighborhood = "neighborhood",
    premise = "premise",
    subpremise = "subpremise",
    plus_code = "plus_code",
    postal_code = "postal_code",
    natural_feature = "natural_feature",
    airport = "airport",
    park = "park",
    point_of_interest = "point_of_interest",
    floor = "floor",
    establishment = "establishment",
    landmark = "landmark",
    parking = "parking",
    post_box = "post_box",
    postal_town = "postal_town",
    room = "room",
    street_number = "street_number",
    bus_station = "bus_station",
    train_station = "train_station",
    transit_station = "transit_station",
}