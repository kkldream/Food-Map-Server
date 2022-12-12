export default {
  // https://developers.google.com/maps/documentation/places/web-service/supported_types
  foodTypeList: [
    "cafe",
    "food",
    "restaurant",
    "meal_takeaway"
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
}
