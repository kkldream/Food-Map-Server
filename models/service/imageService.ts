import config from "../../config";
import {photoDocument, photoItem} from "../dataStruct/mongodb/photoDocument";
import {insertGoogleApiPhotoLog} from "./googleApiLogService";
import {errorCodes, throwError} from "../dataStruct/throwError";
import {googlePhotosItem} from "../dataStruct/originalGoogleResponse/pubilcItem";
import sharp from "sharp";

const imageToBase64 = require('image-to-base64');

function getLegacyCompressedSize(width: number, height: number): {width: number; height: number} {
    const maxSide = Math.max(width, height);
    if (maxSide <= config.image.maxWidth) {
        return {width, height};
    }

    // Keep the historical canvas sizing formula for backward-compatible output.
    const minSide = Math.min(width, height);
    const resizedMinSide = Math.max(1, Math.round((minSide / maxSide) * 1024));

    if (width > height) {
        return {width: config.image.maxWidth, height: resizedMinSide};
    }

    return {width: resizedMinSide, height: config.image.maxWidth};
}

export async function googleImageListConvertPhotoId(photoReference: googlePhotosItem[]): Promise<string[]> {
    if (!photoReference) return [];
    if (photoReference.length > 5) photoReference.length = 5; // 限制圖片張數
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
        await insertGoogleApiPhotoLog({photoReference: googlePhoto, response: photo});
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

export async function getPhotoId(req: {
    updateTime: Date;
    photo_reference?: string;
    uploadUser?: {
        name: string;
        url: string;
    };
    photoItem: photoItem;
}): Promise<{
    updated: boolean;
    photoId: string;
}> {
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
    return compressImageBufferToBase64(Buffer.from(base64, 'base64'), rate);
}

export async function compressImageBufferToBase64(buff: Buffer, rate: number = 0.5): Promise<photoItem> {
    const image = sharp(buff).rotate();
    const metadata = await image.metadata();
    const sourceWidth = metadata.autoOrient?.width ?? metadata.width;
    const sourceHeight = metadata.autoOrient?.height ?? metadata.height;

    if (!sourceWidth || !sourceHeight) {
        throw new Error("Image dimensions are missing before compression");
    }

    const targetSize = getLegacyCompressedSize(sourceWidth, sourceHeight);
    const pipeline = image.resize({
        width: targetSize.width,
        height: targetSize.height,
        fit: 'fill',
        withoutEnlargement: true
    });

    const quality = Math.max(1, Math.min(100, Math.round(rate * 100)));
    const {data, info} = await pipeline
        .jpeg({quality})
        .toBuffer({resolveWithObject: true});

    if (!info.width || !info.height) {
        throw new Error("Image dimensions are missing after compression");
    }

    const base64 = data.toString('base64');

    return {
        width: info.width,
        height: info.height,
        data: base64,
        length: base64.length,
        format: "jpeg"
    };
}
