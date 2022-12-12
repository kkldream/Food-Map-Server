import {dbPhotoItem} from "../dataStruct/mongodb/googlePlaceDocument";
import config from "../../config";
import {googlePhotosItem} from "../dataStruct/mongodb/originalGooglePlaceData";
const imageToBase64 = require('image-to-base64');
const Canvas = require('canvas');

export async function googleImageListConvertDb(photoReference: googlePhotosItem[], maxWidth: number = config.image.maxWidth, rate: number = config.image.compressRate): Promise<dbPhotoItem[]> {
    if (!photoReference) return [];
    return await Promise.all(photoReference.map(async (googlePhoto: googlePhotosItem): Promise<dbPhotoItem> => {
        let imageUrl = "https://maps.googleapis.com/maps/api/place/photo?"
            + `&maxwidth=${maxWidth}&`
            + `photoreference=${googlePhoto.photo_reference}`
            + `&key=${process.env.GOOGLE_API_KEY}`;
        return await compressUrlImageToBase64(imageUrl, rate);
    }));
}

async function compressUrlImageToBase64(url: string, rate: number = 0.5): Promise<dbPhotoItem> {
    let base64 = await imageToBase64(url);
    let buff = Buffer.from(base64, 'base64');
    return await compress(buff, rate);
}

async function compress(buff: Buffer, rate: number): Promise<dbPhotoItem> {
    // console.log(buff.length);
    // 将文件绘制成图片对象
    let image = new Canvas.Image();
    image.src = buff;

    // 获取原始图片宽高
    let drawWidth = image.width;
    let drawHeight = image.height;

    // 以下改变一下图片大小
    var maxSide = Math.max(drawWidth, drawHeight);
    if (maxSide > 600) {
        var minSide = Math.min(drawWidth, drawHeight);
        minSide = minSide / maxSide * 1024;
        maxSide = 600;
        if (drawWidth > drawHeight) {
            drawWidth = maxSide;
            drawHeight = minSide;
        } else {
            drawWidth = minSide;
            drawHeight = maxSide;
        }
    }

    // 用 canvas 重绘
    let canvas = new Canvas.createCanvas(drawHeight, drawWidth);
    let context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, drawHeight, drawWidth);
    let data: string = canvas.toDataURL('image/jpeg', rate).slice(23);
    return {
        width: drawHeight,
        height: drawWidth,
        data: data,
        length: data.length,
        format: "jpeg"
    };
}
