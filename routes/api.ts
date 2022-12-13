import {Router} from 'express';
import apiResponseBase from '../models/dataStruct/apiResponseUserBase';
import placeRoute from './api/placeRoute';
import googleApiRoute from './api/googleApiRoute';
import userRoute from './api/userRoute';
import rootRoute from "./api/rootRoute";

const router = Router()

router.use('/place', placeRoute);
router.use('/google_api', googleApiRoute);
router.use('/user', userRoute);
router.use('/root', rootRoute);

router.get('/', function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    response.status = 0;
    response.result = {msg: 'api is ready'};
    res.send(response);
});

router.use(function (req: any, res: any, next: any) {
    let response = new apiResponseBase();
    response.status = -1;
    response.errMsg = new Error(`Not found '${req.url}' api`);
    res.send(response);
});

export default router;
