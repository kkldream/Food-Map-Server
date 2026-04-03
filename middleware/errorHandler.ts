import {NextFunction, Request, Response} from 'express';
import createError from 'http-errors';

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(createError(404));
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  void next;
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
}
