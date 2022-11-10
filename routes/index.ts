import express from 'express';
const router = express.Router();

/* GET home page. */
router.get('/', function(req: any, res: any, next: any) {
    res.render('index', { title: 'Express' });
});

router.get('/time', function(req: any, res: any, next: any) {
    res.send({time: new Date()});
});

module.exports = router;
