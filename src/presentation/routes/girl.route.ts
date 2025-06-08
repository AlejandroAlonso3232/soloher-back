import { Router } from "express";
import { config } from "../../core/config/app.config";
import { CloudinaryAdapter } from "../../application/adapters/CloudinaryAdapter";
import { GirlService } from "../../application/services/girl.service";
import { GirlRepository } from "../../infrastructure/database/repositories/girl.repository";
import { GirlController } from "../controllers/Girl.controller";
import { AuthMiddleware } from "../../infrastructure/middlewares/authenticated";
import { UserRepository } from "../../infrastructure/database/repositories/user.repository";
import { S3Adapter } from "../../application/adapters/s3.adapter";
import  { s3ConfigGirls } from "../../core/config/s3.config";

// En tu configuración
const cloudinaryConfig = {
  cloudName: config.CLOUDINARY_CLOUD_NAME!,
  apiKey: config.CLOUDINARY_API_KEY!,
  apiSecret: config.CLOUDINARY_API_SECRET!,
  allowedFormats: ["jpg", "png", "webp"],
  maxFileSizeMB: 10,
  defaultFolder: "user_uploads",
};

// Inyección de dependencias
const cloudinaryAdapter = new CloudinaryAdapter(cloudinaryConfig);
const girlRepository = new GirlRepository();
const s3Adapter = new S3Adapter(s3ConfigGirls);
const girlService = new GirlService(
  girlRepository,
  cloudinaryAdapter,
  s3Adapter
);

const userRepository = new UserRepository(); // Asumiendo que GirlRepository implementa IUserRepository
const authenticatedMiddleware = new AuthMiddleware(userRepository);

const girlController = new GirlController(girlService);

const girlRouter = Router();

girlRouter.post(
  "/",
  authenticatedMiddleware.authenticate.bind(authenticatedMiddleware),
  girlController.createGirl.bind(girlController)
);
girlRouter.get("/", girlController.getAllGirls.bind(girlController));

girlRouter.get(
  "/:id",
  authenticatedMiddleware.authenticate.bind(authenticatedMiddleware),
  girlController.getGirlById.bind(girlController)
);
girlRouter.get(
  "/slug/:slug",
  girlController.getGirlBySlug.bind(girlController)
);

girlRouter.put(
  "/:id",
  authenticatedMiddleware.authenticate.bind(authenticatedMiddleware),
  girlController.updateGirl.bind(girlController)
);

girlRouter.delete(
  "/:id",
  authenticatedMiddleware.authenticate.bind(authenticatedMiddleware),
  girlController.deleteGirl.bind(girlController)
);

export default girlRouter;
