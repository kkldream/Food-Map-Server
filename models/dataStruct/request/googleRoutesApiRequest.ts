export interface googleRoutesApiRequest {
    origin: waypointByLocation | waypointByPlaceId;
    destination: waypointByLocation | waypointByPlaceId;
    travelMode?: routeTravelModeEnum;
    routingPreference?: routeTravelModeEnum;
    departureTime?: string; // ex: "2023-10-15T15:01:23.045123456Z"
    computeAlternativeRoutes?: false;
    routeModifiers?: {
        avoidTolls?: boolean; // 指定在合理情況下避免避開道路。系統會偏好未包含收費路段的路徑。僅適用於 DRIVE 和 TWO_WHEELER 交通方式。
        avoidHighways?: boolean; // 指定是否要在合理情況下避開高速公路。系統會參照不含高速公路的路徑。僅適用於 DRIVE 和 TWO_WHEELER 交通方式。
        avoidFerries?: boolean; // 指定是否要在合理情況下避開渡輪。系統會將航線視為不含渡輪的航線。僅適用於 DRIVE 和 TWO_WHEELER 交通方式。
        avoidIndoor?: boolean; // 指定是否合理避免在室內導航。系統會參照不含室內導航的路徑。僅適用於 WALK 交通方式。
        vehicleInfo?: { emissionType: emissionTypeEnum }; // 指定車輛資訊。
        tollPasses?: tollPassEnum; // 用不到
    };
    languageCode?: string;
    units?: string;
}

export interface waypointByLocation {
    "location": {
        "latLng": {
            "latitude": number;
            "longitude": number;
        };
    };
}

export interface waypointByPlaceId {
    place_id: string;
}

// https://developers.google.com/maps/documentation/routes/reference/rest/v2/RouteTravelMode
export enum routeTravelModeEnum {
    TRAVEL_MODE_UNSPECIFIED = "TRAVEL_MODE_UNSPECIFIED",
    DRIVE = "DRIVE",
    BICYCLE = "BICYCLE",
    WALK = "WALK",
    TWO_WHEELER = "TWO_WHEELER",
}

// https://developers.google.com/maps/documentation/routes/reference/rest/v2/RoutingPreference
export enum routeTravelModeEnum {
    ROUTING_PREFERENCE_UNSPECIFIED = "ROUTING_PREFERENCE_UNSPECIFIED",
    TRAFFIC_UNAWARE = "TRAFFIC_UNAWARE",
    TRAFFIC_AWARE = "TRAFFIC_AWARE",
    TRAFFIC_AWARE_OPTIMAL = "TRAFFIC_AWARE_OPTIMAL",
}

// https://developers.google.com/maps/documentation/routes/reference/rest/v2/RouteModifiers#vehicleemissiontype
export enum emissionTypeEnum {
    VEHICLE_EMISSION_TYPE_UNSPECIFIED = "VEHICLE_EMISSION_TYPE_UNSPECIFIED", // 未指定排放類型。預設為 GASOLINE。
    GASOLINE = "GASOLINE", // 汽油/加油站。
    ELECTRIC = "ELECTRIC", // 電動車。
    HYBRID = "HYBRID", // 混合燃料 (例如汽油 + 電動車)。
    DIESEL = "DIESEL", // 柴油車。
}

// https://developers.google.com/maps/documentation/routes/reference/rest/v2/RouteModifiers#tollpass
export enum tollPassEnum {
    TOLL_PASS_UNSPECIFIED = "TOLL_PASS_UNSPECIFIED",
}
