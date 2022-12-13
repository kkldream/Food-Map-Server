import config from "../config"
import userMgr from "./userMgr";

async function pushBlackList(placeIdList: string[]) {
    return userMgr.pushBlackList(config.root.userId, placeIdList);
}

async function pullBlackList(placeIdList: string[]) {
    return userMgr.pullBlackList(config.root.userId, placeIdList);
}

async function getBlackList() {
    return userMgr.getBlackList(config.root.userId);
}

export default {
    pushBlackList,
    pullBlackList,
    getBlackList,
};
