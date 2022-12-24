import express, {Router} from "express";
import path from "path";

const router = Router();

let history = require('connect-history-api-fallback');
router.use(express.static(path.join(__dirname, "../vue/dist")));
router.use(history());

// router.get('/', function (req: any, res: any, next: any) {
//     res.render('index', {title: 'Food Map'});
// });

// router.get('/time', function (req: any, res: any, next: any) {
//     res.send({time: new Date()});
// });

export default router;
