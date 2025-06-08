import { MegaAdapterConfig } from "../../application/adapters/MegaAdapter";

// Configuración
const megaConfig: MegaAdapterConfig = {
  email: process.env.MEGA_EMAIL || '',
  password: process.env.MEGA_PASSWORD || '',
  allowedFormats: ['jpg', 'png', 'pdf'],
  maxFileSizeMB: 50,
  defaultFolder: 'mi-app'
};