import {Router} from "express";

const router = Router();

/* GET home page. */
router.get('/', function (req: any, res: any, next: any) {
    res.render('index', {title: 'Express'});
});

router.get('/time', function (req: any, res: any, next: any) {
    res.send({time: new Date()});
});

export default router;
