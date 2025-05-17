// src/core/domain/schemas/user.schema.ts
import { z } from "zod";

const roles = ["user", "admin", "moderator"] as const;

export const CreateUserSchema = z.object({
  name: z
    .string()
    .min(3, "Nombre debe tener al menos 3 caracteres")
    .max(50, "Nombre no puede exceder 50 caracteres"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^a-zA-Z0-9]/, "Debe contener al menos un carácter especial").optional(),
  role: z.enum(roles).default("user"),
  imageProfile: z.string().url("URL de imagen inválida").optional(),
  secureUrl: z.string().optional(),
  
});

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  id: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
export type UserRole = z.infer<typeof CreateUserSchema>["role"];
