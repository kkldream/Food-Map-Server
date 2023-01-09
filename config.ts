import {foodTypeEnum} from "./models/dataStruct/staticCode/foodTypeEnum";

export default {
    // https://developers.google.com/maps/documentation/places/web-service/supported_types
    foodTypeList: [
        foodTypeEnum.restaurant,
    ],
    drawCard: {
        near: {
            maxDistance: 1000,
            ratingStar: 4,
            ratingTotal: 100,
        },
        favorite: {
            maxDistance: 3000,
        }
    },
    reUpdateIntervalSecond: 60 * 60 * 24 * 30,
    image: {
        maxWidth: 600,
        compressRate: 0.6,
        defaultId: "639d6ed9eb340eb22b49cfe5",
    },
    root: {
        userId: "63a1268373a9870146721a0f"
    },
}
