import express, {Application} from 'express';
import { applyErrorMiddleware, applyMiddlewares } from '../middlewares';
import routes from '../../presentation/routes';
import { config } from '../../core/config/app.config';
import { connectDB, disconnectDB } from '../database/DB';

export class ExpressServer {
    private app: Application;

    constructor() {
    this.app = express();
    this.setup();
  }

  

  private setup():void {
    applyMiddlewares(this.app);
    this.app.use(routes);
    applyErrorMiddleware(this.app);
  }

  public async start(): Promise<void> {
    try {

      await connectDB();

      this.app.listen(config.PORT, () => {
          console.log(`Server is running on http://localhost:${config.PORT}`);
      })
    } catch (error) {
      await disconnectDB();
    }
  }

  public getApp(): Application {
    return this.app;
  }
}
