import express from 'express';

const router = express.Router();
const api = require('../models/appApi');
const googleMapsApi = require('../models/googleMapsApi');

router.get('/', function(req: any, res: any, next: any) {
    res.render('index', { title: 'API' });
});

router.use('/', function (req: any, res: any, next: any) {
    let token = req.body.token;
    if (token === process.env.REQUEST_TOKEN) {
        delete req.body.token;
        next();
    } else res.send({errMsg: 'token fail'});
});

router.post('/restaurant/update', async function(req: any, res: any, next: any) {
    let response: any = {
        status: 0,
        requestTime: new Date(),
        result: []
    };
    try {
        let { latitude, longitude, radius } = req.body;
        let result = await googleMapsApi.updateRestaurant(latitude, longitude, radius);
        response.result = { insertedCount: result.insertedCount };
    } catch (error: any) {
        response.status = -1;
        response.errMsg = error;
    }
    res.send(response);
});

router.post('/restaurant/search_by_near', async function(req: any, res: any, next: any) {
    let response: any = {
        status: 0,
        requestTime: new Date(),
        result: []
    };
    try {
        let { latitude, longitude, radius } = req.body;
        response.result = await api.searchByLocation(latitude, longitude, radius);
    } catch (error: any) {
        response.status = -1;
        response.errMsg = error;
    }
    res.send(response);
});

router.post('/restaurant/search_by_name', async function(req: any, res: any, next: any) {
    let response: any = {
        status: 0,
        requestTime: new Date(),
        result: []
    };
    try {
        let { name } = req.body;
        response.result = await api.searchByName(name);
    } catch (error: any) {
        response.status = -1;
        response.errMsg = error;
    }
    res.send(response);
});

module.exports = router;
