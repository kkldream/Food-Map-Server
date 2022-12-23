import config from "../../config";
import {googlePhotosItem} from "../dataStruct/mongodb/originalGooglePlaceData";
import {photoDocument, photoItem} from "../dataStruct/mongodb/photoDocument";
import {insertGoogleApiPhotoLog} from "./googleApiLogService";
import {errorCodes, throwError} from "../dataStruct/throwError";

const imageToBase64 = require('image-to-base64');
const Canvas = require('canvas');

interface insertPhotoItemInput {
    updateTime: Date;
    photo_reference?: string;
    uploadUser?: {
        name: string;
        url: string;
    };
    photoItem: photoItem;
}

export async function googleImageListConvertPhotoId(photoReference: googlePhotosItem[]): Promise<string[]> {
    if (!photoReference) return [];
    const photoCol = global.mongodbClient.foodMapDb.photoCol;
    let responseTime = new Date();
    return await Promise.all(photoReference.map(async (googlePhoto: googlePhotosItem): Promise<string> => {
        let existPhoto: photoDocument = await photoCol.findOne({photo_reference: googlePhoto.photo_reference});
        if (existPhoto) return existPhoto._id?.toString() ?? config.image.defaultId;
        let imageUrl = "https://maps.googleapis.com/maps/api/place/photo?"
            + `&maxwidth=${config.image.maxWidth}`
            + `&photoreference=${googlePhoto.photo_reference}`
            + `&key=${process.env.GOOGLE_API_KEY}`;
        let photo: photoItem = await compressUrlImageToBase64(imageUrl, config.image.compressRate);
        await insertGoogleApiPhotoLog({photoReference: googlePhoto, response: photo})
        let uploadUserTemp = googlePhoto.html_attributions[0];
        let {photoId} = await getPhotoId({
            updateTime: responseTime,
            photo_reference: googlePhoto.photo_reference,
            uploadUser: {
                name: uploadUserTemp.split("\"")[2].slice(1, -4),
                url: uploadUserTemp.split("\"")[1]
            },
            photoItem: photo
        });
        return photoId;
    }));
}

interface getPhotoIdResponse {
    updated: boolean;
    photoId: string;
}

export async function getPhotoId(req: insertPhotoItemInput): Promise<getPhotoIdResponse> {
    let nowTime = new Date();
    const photoCol = global.mongodbClient.foodMapDb.photoCol;
    let photoDoc: photoDocument = req.photo_reference
        ? await photoCol.findOne({photo_reference: req.photo_reference})
        : await photoCol.findOne({data: req.photoItem.data});
    if (photoDoc) {
        await photoCol.updateOne({_id: photoDoc._id}, {$set: {updateTime: req.updateTime, ...req.photoItem}});
        return {
            updated: false,
            photoId: (photoDoc._id ?? "").toString()
        };
    }
    let insertDoc: photoDocument = {
        creatTime: nowTime,
        updateTime: nowTime,
        photo_reference: req.photo_reference,
        uploadUser: req.uploadUser,
        ...req.photoItem
    }
    let insertResult = await photoCol.insertOne(insertDoc);
    return {
        updated: true,
        photoId: insertResult.insertedId.toString()
    };
}

export async function compressUrlImageToBase64(url: string, rate: number = 0.5): Promise<photoItem> {
    let base64: string = "";
    try {
        base64 = await imageToBase64(url);
    } catch (error) {
        throwError(errorCodes.photoUrlError);
    }
    let buff = Buffer.from(base64, 'base64');

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
    // let canvas = new Canvas.createCanvas(drawHeight, drawWidth);
    let canvas = new Canvas.createCanvas(drawWidth, drawHeight);
    let context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, drawWidth, drawHeight);
    let data: string = canvas.toDataURL('image/jpeg', rate).slice(23);
    return {
        // width: drawHeight,
        // height: drawWidth,
        width: drawWidth,
        height: drawHeight,
        data: data,
        length: data.length,
        format: "jpeg"
    };
}
