import {responseLocationItem} from "./dataStruct/response/publicItem/responseLocationItem";
import {dbLocationItem} from "./dataStruct/mongodb/publicItem/dbLocationItem";

export function generateUUID() {
    let d = new Date().getTime();
    const uuid = 'xxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

export function dbLocationConvertResponse(dbLocation: dbLocationItem): responseLocationItem {
    return {
        lat: dbLocation.coordinates[1],
        lng: dbLocation.coordinates[0]
    }
}

export function responseLocationConvertDb(responseLocation: responseLocationItem): dbLocationItem {
    return {
        type: "Point",
        coordinates: [responseLocation.lng, responseLocation.lat]
    }
}

export function getDateFormat() {
    const date = new Date();
    const year = date.getFullYear();
    const mouth = date.getMonth().toString().padStart(2, '0');
    const day = date.getDay().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}/${mouth}/${day}-${hours}:${minutes}:${seconds}`;
}

export function twoPointDistance(p1: { x: number, y: number }, p2: { x: number, y: number }) {
    let distance = Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
    return distance;
}

export function twoLocateDistance(point1: any, point2: any) {
    let [y1, x1] = point1;
    let [y2, x2] = point2;
    let Lat1 = rad(x1); // 纬度
    let Lat2 = rad(x2);
    let a = Lat1 - Lat2;//	两点纬度之差
    let b = rad(y1) - rad(y2); //	经度之差
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2)
        + Math.cos(Lat1) * Math.cos(Lat2) * Math.pow(Math.sin(b / 2), 2)));
    //	计算两点距离的公式
    s = s * 6378137.0;//	弧长等于弧度乘地球半径（半径为米）
    s = Math.round(s * 10000) / 10000;//	精确距离的数值
    return s;

}

//	角度转换成弧度
const rad = (d: any) => {
    return d * Math.PI / 180.00;
};

export function randInt(min: number, max: number) {
    return Math.random() * (max - min) + min;
}
