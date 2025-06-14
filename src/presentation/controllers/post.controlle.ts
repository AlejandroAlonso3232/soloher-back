import { Response } from "express";
import { PostService } from "../../application/services/post.service";
import { ZodError } from "zod";
import { createPostSchema } from "../../core/domain/schemas/post.schema";

declare module "express" {
  interface Request {}
}

export class PostController {
  constructor(private readonly service: PostService) {}

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
      "El Titulo ya existe": 409,
      "post no encontrado": 404,
      "Credenciales Invalidas": 401,
    };
    // Si el mensaje de error está en el mapa, devuelve el código correspondiente
    const statusCode = errorStatusMap[error.message] || 500;

    //Mandar respuesta de error
    res.status(statusCode).json({
      message: error.message || "Internal server error",
    });
  }

  async createPost(req: Request | any, res: Response) {
    try {
      // Validar los datos de entrada
      const validateData = createPostSchema.parse(req.body);
      // Extraer los datos del cuerpo de la solicitud
      const content = req.files?.content;

      const typeContent = content?.mimetype.startsWith("image/")
        ? "image"
        : "video";
      console.log("Tipo de contenido:", typeContent);

      const image = typeContent === "image" ? content : undefined;
      const video = typeContent === "video" ? content : undefined;

      console.log("Contenido del archivo:", {
        image: image ? image : "No image provided",
        video: video ? video : "No video provided",
        type: typeContent,
      });

      const post = await this.service.createPost(validateData, {
        image,
        video,
        type: typeContent,
      });

      res.status(201).json(post);
    } catch (error) {
      this.handleError(res, error);
    }
  }
  async getAllPost(req: Request | any, res: Response) {
    try {
      const {
        page,
        limit,
        sortBy,
        sortDir,
        searchTerm,
        status,
        visibility,
        contentType,
        minLikes,
        maxLikes,
        minViews,
        maxViews,
        featured,
        hasPoll,
        publishedAfter,
        publishedBefore,
      } = req.query;

      // Convertir y preparar las opciones
      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortDir: sortDir,
        searchTerm: searchTerm as string,
        status: status,
        visibility: visibility,
        contentType: contentType,
        minLikes: minLikes ? parseInt(minLikes as string, 10) : undefined,
        maxLikes: maxLikes ? parseInt(maxLikes as string, 10) : undefined,
        minViews: minViews ? parseInt(minViews as string, 10) : undefined,
        maxViews: maxViews ? parseInt(maxViews as string, 10) : undefined,
        featured,
        hasPoll,
        publishedAfter,
        publishedBefore,
      };

      const girls = await this.service.getAllPosts(options);

      res.status(200).json(girls);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getPostBySlug(req: Request | any, res: Response | any) {
    try {
      const { slug } = req.params;
      const post = await this.service.getPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.status(200).json(post);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updatePost(req: Request | any, res: Response) {
    try {
      const { id } = req.params;
      // Validar los datos de entrada
      // const validateData = createPostSchema.parse(req.body);
      // Extraer los archivos de la solicitud
      const content = req.files?.content;
      // console.log("Contenido del archivo:", content);

      // console.log("Contenido del archivo:", req.files);
      // console.log("Contenido del archivo:", req.body);

      let images = [] as any[];
      let videos = [] as any[];
      // console.log("Contenido del archivo:", content);

      if (content) {
        //checamos si el content es un array o un solo archivo
        if (Array.isArray(content)) {
          for (const key in content) {
            if (content.hasOwnProperty(key)) {
              const file = content[key];
              if (file.mimetype.startsWith("image/")) {
                images.push(file);
              } else if (file.mimetype.startsWith("video/")) {
                videos.push(file);
              }
            }
          }
        } else {
          // Si es un solo archivo, lo agregamos directamente
          if (content.mimetype.startsWith("image/")) {
            images.push(content);
          } else if (content.mimetype.startsWith("video/")) {
            videos.push(content);
          }
        }
      }

      console.log(req.body.title);
      

      const post = await this.service.updatePost(id, req.body, images, videos);

      res.status(200).json(post);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async deleteContent(req: Request | any, res: Response | any) {
    try {
      const { id } = req.params;
      const { contentUrl } = req.body;

      if (!contentUrl) {
        return res.status(400).json({ message: "Content URL is required" });
      }

      const post = await this.service.deleteContent(id, contentUrl);

      return res.status(200).json({
        message: "Content deleted successfully",
        post,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
