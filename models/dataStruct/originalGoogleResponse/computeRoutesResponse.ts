export interface computeRoutesResponse {
    routes: getRoutePolylineItem[];
}

interface getRoutePolylineItem {
    distanceMeters: number;
    duration: string;
    polyline: {
        encodedPolyline: string;
    };
}
