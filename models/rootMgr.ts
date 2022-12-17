import config from "../config"
import userMgr from "./userMgr";
import {photoItem} from "./dataStruct/mongodb/photoDocument";
import {compressUrlImageToBase64, getPhotoId} from "./service/imageService";

async function pushBlackList(placeIdList: string[]) {
    return userMgr.pushBlackList(config.root.userId, placeIdList);
}

async function pullBlackList(placeIdList: string[]) {
    return userMgr.pullBlackList(config.root.userId, placeIdList);
}

async function getBlackList() {
    return userMgr.getBlackList(config.root.userId);
}

async function pushUrlPhoto(url: string): Promise<any> {
    let photo: photoItem = await compressUrlImageToBase64(url, config.image.compressRate);
    let {updated, photoId} = await getPhotoId({
        updateTime: new Date(),
        photoItem: photo
    });
    return {updated, photoId, content: photo};
}

export default {
    pushBlackList,
    pullBlackList,
    getBlackList,
    pushUrlPhoto,
};
