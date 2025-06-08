import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";
import { CloudinaryError } from "../../core/errors";
import { ImageUploadResult } from "./CloudinaryAdapter"; // Reutilizamos la misma interfaz
import fs from "fs/promises";
import mime from "mime-types";

export interface S3AdapterConfig {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  defaultFolder?: string;
  allowedFormats: string[];
  maxFileSizeMB: number;
  signedUrlExpiration?: number; // Tiempo en segundos (opcional)
}

export class S3Adapter {
  private readonly config: S3AdapterConfig;
  private readonly s3Client: S3Client;

  constructor(config: S3AdapterConfig) {
    this.validateConfig(config);
    this.config = config;

    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  private validateConfig(config: S3AdapterConfig): void {
    const required = ["bucketName", "region", "accessKeyId", "secretAccessKey"];
    required.forEach((field) => {
      if (!config[field as keyof S3AdapterConfig]) {
        throw new Error(`S3 config error: Missing ${field}`);
      }
    });

    if (config.maxFileSizeMB > 100) {
      throw new Error("Max file size cannot exceed 100MB");
    }
  }

  private getKey(fileName: string, folder?: string): string {
    const baseFolder = this.config.defaultFolder || "uploads";
    return folder
      ? `${baseFolder}/${folder}/${fileName}`
      : `${baseFolder}/${fileName}`;
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split(".").pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  async upload(
    file: string | Buffer | any,
    options: {
      folder?: string;
      public_id?: string;
      metadata?: Record<string, string>;
      originalname?: string; // Para manejar el caso de Buffer
      getDimensions?: boolean; // Si se requieren dimensiones de la imagen
    } = {}
  ): Promise<ImageUploadResult> {
    try {
      // console.log("file", file);

      // console.log("data" in file);

      // Manejo de diferentes tipos de entrada
      let fileBuffer: Buffer;
      let originalName: string;

      if (typeof file === "string") {
        // Si es una ruta de archivo
        fileBuffer = await fs.readFile(file);
        originalName = file.split("/").pop() || `file-${Date.now()}`;
      } else if (file && file.tempFilePath) {
        // MANEJO CORREGIDO PARA EXPRESS-FILEUPLOAD
        fileBuffer = await fs.readFile(file.tempFilePath);
        originalName = file.name;
      } else if (file && file.data) {
        // Si es un objeto de Express.Multer.File con buffer
        fileBuffer = file.data;
        originalName = file.name;
      } else if (Buffer.isBuffer(file)) {
        // Si es un Buffer directo
        fileBuffer = file;
        originalName = options.originalname || `file-${Date.now()}`;
      } else {
        throw new Error("Tipo de archivo no soportado");
      }

      // Validar que fileBuffer tiene contenido
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error("El buffer del archivo está vacío");
      }

      // Validar formato
      const fileExtension = originalName.split(".").pop()?.toLowerCase() || "";

      // console.log(
      //   `Subiendo archivo: ${originalName} con extensión ${fileExtension}`
      // );

      if (!this.config.allowedFormats.includes(fileExtension)) {
        throw new CloudinaryError(
          "UPLOAD_FAILED",
          `Formato no permitido. Formatos permitidos: ${this.config.allowedFormats.join(
            ", "
          )}`
        );
      }

      // Validar tamaño
      if (fileBuffer.length > this.config.maxFileSizeMB * 1024 * 1024) {
        throw new CloudinaryError(
          "UPLOAD_FAILED",
          `El archivo excede el tamaño máximo de ${this.config.maxFileSizeMB}MB`
        );
      }

      const fileName = this.generateFileName(originalName);
      const key = this.getKey(fileName, options.folder);

      // Obtener tipo MIME
      const contentType = mime.lookup(originalName) || "image/jpeg";

      // Subida paralela para mejores rendimiento con archivos grandes
      const parallelUpload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.config.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          Metadata: options.metadata,
        },
        queueSize: 4, // Número de partes paralelas
        partSize: 5 * 1024 * 1024, // Tamaño de parte de 5MB
      });

      await parallelUpload.done();

      // Obtener metadatos para dimensiones (requiere librería adicional)
      const { width, height } = options.getDimensions
        ? await this.getImageDimensions(fileBuffer)
        : { width: 0, height: 0 };

      return {
        publicId: key,
        url: `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`,
        secureUrl: `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`,
        width,
        height,
        format: fileExtension,
        bytes: fileBuffer.length,
        signature: "", // No aplicable para S3
      };
    } catch (error) {
      console.log("Error en S3Adapter.upload:", error);

      throw new CloudinaryError(
        "UPLOAD_FAILED",
        `Error al subir archivo: ${(error as Error).message}`,
        { publicId: options.public_id }
      );
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucketName,
          Key: publicId,
        })
      );
    } catch (error) {
      throw new CloudinaryError(
        "DELETE_FAILED",
        `Error al eliminar archivo: ${(error as Error).message}`,
        { publicId }
      );
    }
  }

  async generateUrl(
    publicId: string,
    transformations: any = {},
    expiresIn: number = this.config.signedUrlExpiration || 3600
  ): Promise<string> {
    try {
      if (transformations.private) {
        return getSignedUrl(
          this.s3Client,
          new GetObjectCommand({
            Bucket: this.config.bucketName,
            Key: publicId,
          }),
          { expiresIn }
        );
      }
      return `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${publicId}`;
    } catch (error) {
      throw new CloudinaryError(
        "UPLOAD_FAILED",
        `Error al generar URL: ${(error as Error).message}`
      );
    }
  }

  private async getImageDimensions(
    buffer: Buffer
  ): Promise<{ width: number; height: number }> {
    // Implementación simplificada - usa una librería como 'sharp' para mejores resultados
    return { width: 0, height: 0 };
  }
}
