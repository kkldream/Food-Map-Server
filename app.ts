import express from 'express';
import path from 'path';
import createError from 'http-errors';

// start express listen
const app = express();
const port = 3000;
app.listen(port, () => {
    console.log(`server is listening on ${port} !!!`);
});

// view engine setup
app.set('views', './views');
app.set('view engine', 'jade');

// routes handler
app.use('/', require('./routes/index'));

// catch 404 and forward to error handler
app.use(function(req: any, res: any, next: any) {
    next(createError(404));
});

// error handler
app.use(function(err: any, req: any, res: any, next: any) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});