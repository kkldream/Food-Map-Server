import {foodTypeEnum} from "./models/dataStruct/staticCode/foodTypeEnum";

export default {
  // https://developers.google.com/maps/documentation/places/web-service/supported_types
  foodTypeList: [
    foodTypeEnum.food,
    foodTypeEnum.meal_delivery,
    foodTypeEnum.meal_takeaway,
    foodTypeEnum.restaurant,
  ],
  minResponseCount: 1,
  drawCard: {
    maxDistance: 1000,
    ratingStar: 4,
    ratingTotal: 100
  },
  detailUpdateRangeSecond: 10,
  image: {
    maxWidth: 400,
    compressRate: 0.5
  },
  root: {
    userId: "6397e9ee54d1a2bf6c2d6869"
  },
}
