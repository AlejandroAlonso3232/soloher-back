import {
  v2 as cloudinary,
  ConfigOptions,
  UploadApiOptions,
  UploadApiResponse,
  TransformationOptions,
} from "cloudinary";

import { config } from "../../core/config/app.config";
import { CloudinaryError } from "../../core/errors";
import { Buffer } from "buffer";
import mime from "mime-types";

export interface ImageUploadResult {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  secureUrl: string;
  signature: string;
}

export interface CloudinaryAdapterConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  defaultFolder?: string;
  allowedFormats: string[];
  maxFileSizeMB: number;
}

export class CloudinaryAdapter {
  private readonly config: CloudinaryAdapterConfig;

  constructor(config: CloudinaryAdapterConfig) {
    this.validateConfig(config);
    this.config = config;

    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
  }

  /**
   * Sube un archivo a Cloudinary con opciones configurables
   * @param file Buffer o path del archivo
   * @param options Opciones de upload
   * @returns Resultado de la subida con metadatos
   */
  async upload(
    file: string | Buffer,
    options: UploadApiOptions = {}
): Promise<ImageUploadResult> {
    try {
        let fileToUpload: string;
        
        if (Buffer.isBuffer(file)) {
            const mimeType = mime.lookup(options.format || 'jpg') || 'image/jpeg';
            const base64 = file.toString('base64');
            fileToUpload = `data:${mimeType};base64,${base64}`;
        } else {
            fileToUpload = file;
        }

        const uploadOptions: UploadApiOptions = {
            folder: this.config.defaultFolder,
            allowed_formats: this.config.allowedFormats,
            transformation: [{ quality: 'auto:best' }],
            bytes_limit: this.config.maxFileSizeMB * 1024 * 1024,
            resource_type: 'auto',
            ...options,  // ¡Error resuelto!
        };

        // const uploadOptions: UploadApiOptions = {
        //     ...baseOptions,
        //     ...options
        // };

        const result = await cloudinary.uploader.upload(fileToUpload, uploadOptions);
        return this.formatResult(result);
    } catch (error) {
        throw new CloudinaryError(
            'UPLOAD_FAILED',
            `Failed to upload file: ${(error as Error).message}`,
            { publicId: options.public_id }
        );
    }
}

  /**
   * Elimina un archivo de Cloudinary
   * @param publicId ID público del recurso
   * @returns Resultado de la eliminación
   */
  async delete(publicId: string): Promise<void> {
    try {
      console.log("Deleting file with public ID:", publicId);
      
      const res = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      });

      // console.log("Delete response:", res);
      
    } catch (error) {
      throw new CloudinaryError(
        "DELETE_FAILED",
        `Failed to delete file: ${(error as Error).message}`,
        { publicId }
      );
    }
  }

  /**
   * Genera URL optimizada con transformaciones
   * @param publicId ID público del recurso
   * @param transformations Opciones de transformación
   * @returns URL segura optimizada
   */
  generateUrl(
    publicId: string,
    transformations: TransformationOptions | any = {}
  ): string {
    return cloudinary.url(publicId, {
      ...transformations,
      quality: "auto:best",
      fetch_format: "auto",
      secure: true,
    });
  }

  private validateConfig(config: CloudinaryAdapterConfig): void {
    const required = ["cloudName", "apiKey", "apiSecret"];
    required.forEach((field) => {
      if (!config[field as keyof CloudinaryAdapterConfig]) {
        throw new Error(`Cloudinary config error: Missing ${field}`);
      }
    });

    if (config.maxFileSizeMB > 100) {
      throw new Error("Max file size cannot exceed 100MB");
    }
  }

  private formatResult(response: UploadApiResponse): ImageUploadResult {
    return {
      publicId: response.public_id,
      url: response.url,
      secureUrl: response.secure_url,
      width: response.width,
      height: response.height,
      format: response.format,
      bytes: response.bytes,
      signature: response.signature,
    };
  }
}
