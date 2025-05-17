import { Request, Response } from "express";
import { UserService } from "../../application/services/user.service";
import { CreateUserSchema } from "../../core/domain/schemas/user.schema";
import { ZodError } from "zod";

declare module "express" {
    interface Request {
        user?: {
            id: string;
            role: string;
            isActive: boolean;
        };
        files?: {
            imageProfile?: {
                tempFilePath: string;
            };
        };
    }
}

export class UserController {
  // private readonly service: UserService;
  constructor(private readonly service: UserService) {}

  // Método para manejar errores
  private handleError(res: Response, error: any) {
    // Verifica si el error es una instancia de ZodError
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    // Mapeo de mensajes de error a códigos HTTP
    const errorStatusMap: Record<string, number> = {
      "El Usuario ya existe": 409,
      "Usuario no encontraso": 404,
      "Credenciales Invalidas": 401,
    };

    // Si el mensaje de error está en el mapa, devuelve el código correspondiente
    const statusCode = errorStatusMap[error.message] || 500;

    //Mandar respuesta de error
    res.status(statusCode).json({
      message: error.message || "Internal server error",
    });
  }


    // Método para registrar un nuevo usuario
    // /api/v1/user/register
  async register(req: Request, res: Response) {
    try {
        // Validar los datos de entrada utilizando Zod
      const validateData = CreateUserSchema.parse(req.body);
      //mandar a la capa de servicio
      const user = await this.service.registerUser(validateData);
      //Respuesta de exito
      res.status(201).json(user);
    } catch (error: any) {
        // Manejo de errores
      this.handleError(res, error);
      // console.log(error);

      // res.status(400).json({
      //     message: error.errors ? error.errors[0].message : error,

      // });
    }
  }

    // Método para iniciar sesión
    // /api/v1/user/login
  async login(req: Request, res: Response) {
    try {
        // Validar los datos de entrada
      const { email, password } = req.body;
        // Verificar si el correo electrónico y la contraseña están presentes
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
            }
        // Llamar al servicio de inicio de sesión
      const user = await this.service.loginUser(email, password);
        // Respuesta de éxito
      res.status(200).json(user);
    } catch (error) {
        // Manejo de errores
      this.handleError(res, error);
      //  res.status(400).json({
      //     message: 'Validation error',

      // });
    }
  }


    // Método para obtener el perfil del usuario
    // /api/v1/user/profile
  async getProfile(req: Request, res: Response) {
    try {
        // Verificar si el usuario está autenticado
      const userId = req.user?.id;
     
        // Llamar al servicio para obtener el perfil del usuario
      const user = await this.service.getUserProfile(userId || "");
        //Respuesta de éxito
      res.status(200).json(user);
    } catch (error) {
        // Manejo de errores
      this.handleError(res, error);
      //  res.status(400).json({
      //     message: 'Validation error',

      // });
    }
  }

    // Método para actualizar el perfil del usuario
    // /api/v1/user/update
  async updateUser(req: Request, res: Response) {
    try {
        // Verificar si el usuario está autenticado
      const userId = req.user?.id;
        // Validar los datos de entrada
      const userData = req.body;
        // Verificar si se ha proporcionado un archivo de imagen
      const imageProfile = req.files;
      // console.log(req);

      //si se proporciona un archivo de imagen, agregarlo a los datos del usuario
      if (imageProfile) {
        const image = imageProfile.imageProfile?.tempFilePath;
        userData.imageProfile = image;
      }

      // console.log(userData);

        // Llamar al servicio para actualizar el perfil del usuario
      const updatedUser = await this.service.updateUserProfile(
        userId || "",
        userData
      );
        // Respuesta de éxito
      res.status(200).json(updatedUser);
    } catch (error) {
        // Manejo de errores
      this.handleError(res, error);
      //  res.status(400).json({
      //     message: 'Validation error',

      // });
    }
  }

    // Método para eliminar el perfil del usuario
    // /api/v1/user/deactivate
  async deactivateUser(req: Request, res: Response) {
    try {
        // Verificar si el usuario está autenticado
      const userId = req.user?.id;
        // Llamar al servicio para eliminar el perfil del usuario
      const updatedUser = await this.service.deactivateUser(userId || "");
        // Respuesta de éxito
      res.status(200).json(updatedUser);
    } catch (error) {
        // Manejo de errores
      this.handleError(res, error);
      //  res.status(400).json({
      //     message: 'Validation error',

      // });
    }
  }
}
