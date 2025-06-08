import { Request, Response } from "express";
import { GirlService } from "../../application/services/girl.service";
import { ZodError } from "zod";
import { CreateGirlSchema } from "../../core/domain/schemas/girl.schema";

declare module "express" {
  interface Request {}
}

export class GirlController {
  constructor(private readonly service: GirlService) {}

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
      "La Chica ya existe": 409,
      "Chica no encontrada": 404,
      "Credenciales Invalidas": 401,
    };

    // Si el mensaje de error está en el mapa, devuelve el código correspondiente
    const statusCode = errorStatusMap[error.message] || 500;

    //Mandar respuesta de error
    res.status(statusCode).json({
      message: error.message || "Internal server error",
    });
  }

  async createGirl(req: Request| any, res: Response) {
    try {
      const validateData = CreateGirlSchema.parse(req.body);

      const girl = await this.service.createGirl(validateData);

      res.status(201).json(girl);
    } catch (error) {
        console.log(error);
        
      this.handleError(res, error);
    }
  }

  async getAllGirls(req: Request | any, res: Response) {
  try {
    const {
      page,
      limit,
      sortBy,
      sortDir,
      searchTerm,
      status,
      country,
      minAge,
      maxAge,
    } = req.query;

    // Convertir y preparar las opciones
    const options = {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sortBy: sortBy as string,
      sortDir: sortDir as "asc" | "desc",
      searchTerm: searchTerm as string,
      status: status as "publico" | "privado" | "eliminado",
      country: country as string,
      minAge: minAge ? parseInt(minAge as string, 10) : undefined,
      maxAge: maxAge ? parseInt(maxAge as string, 10) : undefined,
    };

    const girls = await this.service.getAllGirls(options);

    res.status(200).json(girls);
  } catch (error) {
    this.handleError(res, error);
  }
}

  async getGirlById(req: Request | any, res: Response) {
    try {
      const { id } = req.params;
      const girl = await this.service.getGirlById(id);
      res.status(200).json(girl);
    } catch (error) {
      this.handleError(res, error);
    }
  }
  async getGirlBySlug(req: Request | any, res: Response) {
    try {
      const { slug } = req.params;
      const girl = await this.service.getGirlBySlug(slug);
      res.status(200).json(girl);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateGirl(req: Request | any, res: Response | any) {
    try {
      const userId = req.user?.id;
      const userData = req.body;
      const { id } = req.params;

      //si el usuario no esta logeado da error
      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

        const image = req.files?.image;
      

      const updatedGirl = await this.service.updateGirl(id, userData, image);
      res.status(200).json(updatedGirl);
    } catch (error) {
        
      this.handleError(res, error);
    }
  }

  async deleteGirl(req: Request | any, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.service.deleteGirl(id);
      if (deleted) {
        res.status(200).json({ message: "Chica eliminada correctamente" });
      }
    } catch (error) {
      this.handleError(res, error);
      // res.status(400).json({
      //   message: "Error al eliminar la chica",
    }
  }
}
