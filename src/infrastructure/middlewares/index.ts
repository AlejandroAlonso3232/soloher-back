import express, {Application, NextFunction, Request, Response} from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { config } from '../../core/config/app.config';


export const applyMiddlewares = (app: Application): void => {
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(fileUpload(config.FILE_UPLOAD))

    //logging middleware solo en desarrollo
    if(config.NODE_ENV === 'development') {
        app.use((req: Request, res: Response, next: NextFunction) => {
            console.log(`${req.method} ${req.url}`);
            next();
        });
    }
}

export const applyErrorMiddleware = (app: Application): void => {
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        const statusCode = 'statusCode' in err ? err.statusCode : 500 as any;
        const message = config.NODE_ENV === 'production' ? 'Algo salió mal' : err.message;

        res.status(statusCode).json({
            status: 'error',
            statusCode,
            message,
        });
    })
}

