import { Router } from "express";
import apiResponseBase from '../models/dataStruct/apiResponseUserBase';

const router = Router()

router.use('/restaurant', require('./api/googleRoute'));
router.use('/user', require('./api/userRoute'));
router.use(function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    response.status = -1;
    response.errMsg = `Not found '${req.url}' api`;
    res.send(response);
});

module.exports = router;
