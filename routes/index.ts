import {Router} from "express";

const router = Router();

router.get('/', function (req: any, res: any, next: any) {
    res.render('index', {title: 'Food Map'});
});

router.get('/time', function (req: any, res: any, next: any) {
    res.send({time: new Date()});
});

export default router;
