import {NextFunction, Request, Response} from 'express';
import {getDateFormat} from '../models/utils';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  console.log(`[${getDateFormat()}] ${req.method}: ${req.originalUrl}`);
  next();
}
