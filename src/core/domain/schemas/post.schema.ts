import { z } from "zod";
import { ContentType, PostStatus, Visibility } from '../../../infrastructure/database/models/post.models';

export const createPostSchema = z.object({
  title: z.string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede exceder 100 caracteres"),
  
  slug: z.string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .max(50, "El slug no puede exceder 50 caracteres")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Formato de slug inválido")
    .optional(),
  
  description: z.string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  
//   content: z.array(z.object({
//     type: z.nativeEnum(ContentType),
//     url: z.string().url("URL inválida").min(1, "La URL no puede estar vacía"),
//     thumbnail: z.string().url("URL de thumbnail inválida").optional(),
//     caption: z.string().max(200, "El título no puede exceder 200 caracteres").optional(),
//     duration: z.number().nonnegative("La duración debe ser positiva").optional(),
//     width: z.number().int("El ancho debe ser entero").nonnegative().optional(),
//     height: z.number().int("La altura debe ser entero").nonnegative().optional(),
//     order: z.number().int("El orden debe ser entero").nonnegative().default(0)
//   })).nonempty("El contenido no puede estar vacío"),
  
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  visibility: z.nativeEnum(Visibility).default(Visibility.PRIVATE),
  
  girl: z.string(),
  
  // Campos calculados (no deben venir del cliente)
  likes: z.number().nonnegative().default(0).optional(),
  views: z.number().nonnegative().default(0).optional(),
  shares: z.number().nonnegative().default(0).optional(),
  comments: z.number().nonnegative().default(0).optional(),
  bookmarks: z.number().nonnegative().default(0).optional(),
  imageCount: z.number().nonnegative().default(0).optional(),
  videoCount: z.number().nonnegative().default(0).optional(),
  audioCount: z.number().nonnegative().default(0).optional(),
  
  poll: z.object({
    question: z.string().min(5, "La pregunta debe tener al menos 5 caracteres"),
    options: z.array(
      z.object({
        text: z.string().min(1, "El texto de la opción no puede estar vacío"),
        votes: z.number().nonnegative().default(0).optional()
      })
    ).min(2, "Debe haber al menos 2 opciones").max(10, "No puede haber más de 10 opciones"),
    endsAt: z.date()
      .min(new Date(), "La fecha de finalización debe ser futura")
      .refine(date => date > new Date(), {
        message: "La fecha de finalización debe ser futura"
      }),
    totalVotes: z.number().nonnegative().default(0).optional()
  }).optional(),
  
  tags: z.array(
    z.string().min(2, "Cada tag debe tener al menos 2 caracteres")
  ).max(15, "Máximo 15 tags permitidos").optional(),
  
  keywords: z.array(
    z.string().min(2, "Cada keyword debe tener al menos 2 caracteres")
  ).max(10, "Máximo 10 keywords permitidos").optional(),
  
  metaDescription: z.string()
    .max(160, "La descripción meta no puede exceder 160 caracteres")
    .optional(),
  
  publishedAt: z.date()
    .max(new Date(), "La fecha de publicación no puede ser futura")
    .optional(),
  
  scheduledAt: z.date()
    .min(new Date(), "La fecha programada debe ser futura")
    .optional(),
  
  relatedPosts: z.array(
    z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de post inválido")
  ).max(10, "Máximo 10 posts relacionados").optional(),
  
  featuredIn: z.array(
    z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de colección inválido")
  ).max(5, "Máximo 5 colecciones destacadas").optional()
})
.refine(data => {
  const calculatedFields: (keyof typeof data)[] = [
    'likes', 'views', 'shares', 'comments', 'bookmarks', 
    'imageCount', 'videoCount', 'audioCount'
  ];
  
  // Verificar campos de primer nivel
  const hasInvalidTopLevelField = calculatedFields.some(field => 
    data[field] !== undefined && data[field] !== 0
  );
  
  // Verificar campo anidado
  const hasInvalidNestedField = data.poll?.totalVotes !== undefined && data.poll.totalVotes !== 0;
  
  return !(hasInvalidTopLevelField || hasInvalidNestedField);
}, {
  message: "Los campos de métricas no deben ser enviados",
  path: ['calculatedFields']
})
.refine(data => {
  // Validar que si es scheduled, tenga fecha futura
  if (data.status === PostStatus.ARCHIVED && !data.scheduledAt) {
    return false;
  }
  return true;
}, {
  message: "Los posts programados requieren una fecha de programación",
  path: ['scheduledAt']
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = Partial<CreatePostInput> & { id: string };