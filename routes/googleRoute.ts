import { Router } from "express";
const googleMapsMgr = require('../models/googleMapsMgr');
const apiResponseBase = require('../models/dataStruct/apiResponseBase');
const router = Router()

router.post('/update', async function(req: any, res: any, next: any) {
    let response = apiResponseBase();
    try {
        let { latitude, longitude, radius } = req.body;
        response.result = await googleMapsMgr.updateRestaurant(latitude, longitude, radius);
    } catch (error: any) {
        response.status = -1;
        response.errMsg = error;
    }
    res.send(response);
});

router.post('/search_by_near', async function(req: any, res: any, next: any) {
    let response = apiResponseBase();
    try {
        let { latitude, longitude, radius } = req.body;
        response.result = await googleMapsMgr.searchByLocation(latitude, longitude, radius);
    } catch (error: any) {
        response.status = -1;
        response.errMsg = error;
    }
    res.send(response);
});

router.post('/search_by_name', async function(req: any, res: any, next: any) {
    let response = apiResponseBase();
    try {
        let { name } = req.body;
        response.result = await googleMapsMgr.searchByName(name);
    } catch (error: any) {
        response.status = -1;
        response.errMsg = error;
    }
    res.send(response);
});

module.exports = router;
