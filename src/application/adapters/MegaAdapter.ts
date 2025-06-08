import mega, { Storage, File } from "megajs";
import { Readable } from "stream";
import { config } from "../../core/config/app.config";
// import { MegaError } from "../../core/errors";
import mime from "mime-types";
import fs from "fs";
import { MegaError } from "../../core/errors/mega.errors";

export interface MegaUploadResult {
  fileId: string;
  name: string;
  size: number;
  url: string | null;
  format?: string;
  bytes: number;
  handle: string;
}

export interface MegaAdapterConfig {
  email: string;
  password: string;
  defaultFolder?: string;
  allowedFormats: string[];
  maxFileSizeMB: number;
}

export class MegaAdapter {
  private storage: Storage | null = null;
  private readonly config: MegaAdapterConfig;

  constructor(config: MegaAdapterConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  private async initialize(): Promise<Storage> {
    if (this.storage) return this.storage;

    this.storage = mega({
      email: this.config.email,
      password: this.config.password,
    });

    await this.storage.login();
    return this.storage;
  }

  private validateConfig(config: MegaAdapterConfig): void {
    const required = ["email", "password"];
    required.forEach((field) => {
      if (!config[field as keyof MegaAdapterConfig]) {
        throw new Error(`MEGA config error: Missing ${field}`);
      }
    });

    if (config.maxFileSizeMB > 100) {
      throw new Error("Max file size cannot exceed 100MB");
    }
  }

  async upload(
    file: string | Buffer,
    options: { filename?: string; folder?: string } = {}
  ): Promise<MegaUploadResult> {
    try {
      const storage = await this.initialize();
      const folderName =
        options.folder || this.config.defaultFolder || "uploads";
      const fileName = options.filename || this.generateRandomName();

      // Validar formato
      const format = this.getFileFormat(file, options.filename);
      if (
        this.config.allowedFormats.length > 0 &&
        !this.config.allowedFormats.includes(format)
      ) {
        throw new MegaError(
          "INVALID_FORMAT",
          `Formato no permitido: ${format}`
        );
      }

      // Validar tamaño
      const fileSize = Buffer.isBuffer(file)
        ? file.length
        : fs.statSync(file).size;
      if (fileSize > this.config.maxFileSizeMB * 1024 * 1024) {
        throw new MegaError(
          "SIZE_EXCEEDED",
          `El archivo excede el tamaño máximo de ${this.config.maxFileSizeMB}MB`
        );
      }

      // Crear carpeta si no existe
      let folder = await this.findFolder(storage, folderName);
      if (!folder) {
        folder = await storage.root.mkdir(folderName);
      }

      // Subir archivo
      const fileStream = Buffer.isBuffer(file)
        ? Readable.from(file)
        : fs.createReadStream(file);

      const megaFile = await folder.upload(fileName, fileStream).complete;

      return {
        fileId: megaFile.nodeId,
        name: megaFile.name,
        size: megaFile.size,
        bytes: megaFile.size,
        format,
        url: null, // MEGA requiere compartir explícitamente
        handle: megaFile.downloadId,
      };
    } catch (error) {
      throw new MegaError(
        "UPLOAD_FAILED",
        `Error al subir archivo: ${(error as Error).message}`
      );
    }
  }

  async delete(fileId: string): Promise<void> {
    try {
      const storage = (await this.initialize()) as any;
      const file = storage.files.find((f: any) => f.nodeId === fileId);

      if (!file) {
        throw new MegaError(
          "FILE_NOT_FOUND",
          `Archivo no encontrado: ${fileId}`
        );
      }

      await file.delete(true); // true = eliminar permanentemente
    } catch (error) {
      throw new MegaError(
        "DELETE_FAILED",
        `Error al eliminar archivo: ${(error as Error).message}`
      );
    }
  }

  async generateUrl(fileId: string): Promise<string> {
    try {
      const storage = (await this.initialize()) as any;
      const file = storage.files.find((f: any) => f.nodeId === fileId);

      if (!file) {
        throw new MegaError(
          "FILE_NOT_FOUND",
          `Archivo no encontrado: ${fileId}`
        );
      }

      return await file.link();
    } catch (error) {
      throw new MegaError(
        "URL_GENERATION_FAILED",
        `Error al generar URL: ${(error as Error).message}`
      );
    }
  }

  private getFileFormat(file: string | Buffer, filename?: string): string {
    if (filename) {
      return filename.split(".").pop()?.toLowerCase() || "bin";
    }

    if (Buffer.isBuffer(file)) {
      const mimeType = mime.lookup("bin") || "application/octet-stream";
      return mime.extension(mimeType) || "bin";
    }

    return file.split(".").pop()?.toLowerCase() || "bin";
  }

  private generateRandomName(): string {
    return `file_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  private async findFolder(
    storage: Storage | any,
    name: string
  ): Promise<any | null> {
    const folders = await storage.root.children();
    return (
      folders.find((f: any) => f.name === name && f.type === "directory") ||
      null
    );
  }
}
