import { z } from "zod";

const status = ["publico", "privado", "eliminado"] as const;

const socials = [
  "twitter",
  "instagram",
  "tiktok",
  "youtube",
  "onlyfans",
  "fansly",
  "other",
] as const;

export const CreateGirlSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  username: z
    .string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(30, "El nombre de usuario no puede exceder 30 caracteres"),
  slug: z
    .string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .max(50, "El slug no puede exceder 50 caracteres").optional(),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  image: z.string().url("URL de imagen inválida").optional(),
  publicId: z.string().optional(),
  views: z.number().default(0),
  status: z.enum(status).default("privado"),
  likes: z.number().default(0),
  posts: z.number().default(0),
  age: z.number().int().min(0).max(120).optional(),
  country: z.string().max(50).optional(),
  tags: z.array(z.string()).max(10).optional(),
  socials: z
    .object({
      twitter: z.string().url("URL de Twitter inválida").optional(),
      instagram: z.string().url("URL de Instagram inválida").optional(),
      tiktok: z.string().url("URL de TikTok inválida").optional(),
      youtube: z.string().url("URL de YouTube inválida").optional(),
      onlyfans: z.string().url("URL de OnlyFans inválida").optional(),
      fansly: z.string().url("URL de Fansly inválida").optional(),
      other: z.string().url("URL adicional inválida").optional(),
    })
    .optional(),
});

export const UpdateGirlSchema = CreateGirlSchema.partial().extend({
  id: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CreateGirlDTO = z.infer<typeof CreateGirlSchema>;
export type UpdateGirlDTO = z.infer<typeof UpdateGirlSchema>;
export type GirlStatus = z.infer<typeof CreateGirlSchema>["status"];
export type GirlSocials = z.infer<typeof CreateGirlSchema>["socials"];
