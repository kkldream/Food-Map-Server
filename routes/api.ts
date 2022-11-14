import { Router } from 'express';
import apiResponseBase from '../models/dataStruct/apiResponseUserBase';
import googleRoute from './api/googleRoute';
import userRoute from './api/userRoute';

const router = Router()

router.use('/restaurant', googleRoute);
router.use('/user', userRoute);

router.get('/', function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    response.status = 0;
    response.result = { msg: 'api is ready' };
    res.send(response);
});

router.use(function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    response.status = -1;
    response.errMsg = `Not found '${req.url}' api`;
    res.send(response);
});

export default router;
