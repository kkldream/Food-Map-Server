import {latLngItem} from "../dataStruct/pubilcItem";
import {responseLocationConvertDb} from "../utils";
import config from "../../config";
import {googleApiLogDocument} from "../dataStruct/mongodb/googleApiLogDocument";
import {googleGeocodeAutocompleteResult} from "../dataStruct/originalGoogleResponse/geocodeAutocompleteResponse";

export async function getGeocodeAutocompleteHistory(input: latLngItem | string): Promise<googleGeocodeAutocompleteResult[]> {
    const googleApiLogCol = global.mongodbClient.foodMapDb.googleApiLogCol;
    const options = {allowDiskUse: false};
    if (typeof input !== "string") {
        const location = input as latLngItem;
        let pipeline: any[] = [
            {
                "$geoNear": {
                    "near": responseLocationConvertDb(location),
                    "distanceField": "distance",
                    "spherical": true,
                    "maxDistance": 10,
                    "query": {
                        "mode": "geocode_autocomplete",
                        "createTime": {"$gte": new Date(new Date().setSeconds(-config.reUpdateIntervalSecond))},
                    }
                }
            },
            {"$sort": {"createTime": -1}},
            {"$limit": 1}
        ];
        let historyResult: googleApiLogDocument[] = await googleApiLogCol.aggregate(pipeline, options).toArray();
        if (historyResult.length === 0) return [];
        return historyResult[0].response.data as googleGeocodeAutocompleteResult[];
    } else {
        const address = input as string;
        let query: any = {
            mode: "geocode_autocomplete",
            createTime: {"$gte": new Date(new Date().setSeconds(-config.reUpdateIntervalSecond))},
            "request.address": address
        };
        let historyResult: googleApiLogDocument[] = await googleApiLogCol.find(query).sort({createTime: -1}).limit(1).toArray();
        if (historyResult.length === 0) return [];
        return historyResult[0].response.data as googleGeocodeAutocompleteResult[];
    }
}
