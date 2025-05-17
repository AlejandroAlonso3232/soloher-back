import { Router } from "express";

import { UserController } from "../controllers/user.controller";
import { UserService } from "../../application/services/user.service";

import { UserRepository } from "../../infrastructure/database/repositories/user.repository";

import { mapper } from "../../core/utils/mapper";
import { BcryptAdapter } from "../../application/adapters/Bcrypt";
import { AuthMiddleware } from "../../infrastructure/middlewares/authenticated";
import { JWTAdapter } from "../../application/adapters/JWTAdapter";
import { config } from "../../core/config/app.config";
import { CloudinaryAdapter } from "../../application/adapters/CloudinaryAdapter";

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
export const cloudinaryAdapter = new CloudinaryAdapter(cloudinaryConfig);
const userRepository = new UserRepository();
const bcryptAdapter = new BcryptAdapter();
const jwtAdapter = new JWTAdapter(config.JWT_SECRET!);
const authenticatedMiddleware = new AuthMiddleware(userRepository);
const userService = new UserService(
  userRepository,
  bcryptAdapter,
  jwtAdapter,
  cloudinaryAdapter
);
const userController = new UserController(userService);

const userRouter = Router();
// Modifica las rutas usando .bind()
//Registrar usuario
userRouter.post("/register", userController.register.bind(userController));
// Iniciar sesión
userRouter.post("/login", userController.login.bind(userController));
//Obtener usuario logueado
userRouter.get(
  "/profile",
  authenticatedMiddleware.authenticate.bind(authenticatedMiddleware),
  userController.getProfile.bind(userController)
);
//Actualizar usuario
userRouter.put(
  "/update",
  authenticatedMiddleware.authenticate.bind(authenticatedMiddleware),
  userController.updateUser.bind(userController)
);
//Desactivar usuario
userRouter.put(
  "/deactivate",
  authenticatedMiddleware.authenticate.bind(authenticatedMiddleware),
  userController.deactivateUser.bind(userController)
);

export default userRouter;
