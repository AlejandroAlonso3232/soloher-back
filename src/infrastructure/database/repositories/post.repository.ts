import { PostEntity } from "../../../core/domain/entities/post.entity";
import { CreatePostInput } from "../../../core/domain/schemas/post.schema";
import { mapper } from "../../../core/utils/mapper";
import {
  ContentType,
  PostModel,
  PostStatus,
  Visibility,
} from "../models/post.models";

export type GetAllPostsOptions = {
  page?: number;
  limit?: number;
  sortBy?: keyof PostEntity | string; // Usamos la entidad como referencia
  sortDir?: "asc" | "desc";
  searchTerm?: string;
  status?: PostStatus;
  visibility?: Visibility;
  girl?: string; // ID de la chica asociada
  tags?: string[]; // Filtro por etiquetas
  contentType?: ContentType; // Filtro por tipo de contenido
  minLikes?: number; // Filtro por likes mínimos
  maxLikes?: number; // Filtro por likes máximos
  minViews?: number; // Filtro por vistas mínimas
  maxViews?: number; // Filtro por vistas máximas
  featured?: boolean; // Solo posts destacados
  hasPoll?: boolean; // Solo posts con encuestas
  publishedAfter?: Date; // Posts publicados después de esta fecha
  publishedBefore?: Date; // Posts publicados antes de esta fecha
};

export class PostRepository {
  async createPost(postData: CreatePostInput): Promise<PostEntity> {
    const post = await PostModel.create(postData);
    if (!post) throw new Error("Failed to create post");
    return mapper.toDomainPost(post);
  }

  async getGirltoTitle(title: string): Promise<PostEntity | null> {
    const post = await PostModel.findOne({ title });
    return post ? mapper.toDomainPost(post) : null;
  }

  async getAllPosts(options: GetAllPostsOptions = {}): Promise<{
    data: PostEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  }> {
    const {
      page = 1,
      limit = 9,
      sortBy = "createdAt",
      sortDir = "desc",
      searchTerm = "",
      status,
      visibility,
      girl,
      tags = [],
      contentType,
      minLikes,
      maxLikes,
      minViews,
      maxViews,
      featured = false,
      hasPoll = false,
      publishedAfter,
      publishedBefore,
    } = options;

    const query: any = {};

    // Construcción de consulta mejorada
    const conditions = [];

    // Búsqueda por término
    if (searchTerm) {
      const searchConditions = [
        { title: { $regex: searchTerm, $options: "i" } },
        { slug: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ];

      conditions.push({ $or: searchConditions });
    } else if (tags.length > 0) {
      // Manejar tags sin searchTerm
      conditions.push({ tags: { $in: tags } });
    }

    // Filtros individuales
    if (status) query.status = status;
    if (visibility) query.visibility = visibility;
    if (girl) query.girl = girl;
    if (featured) query.featured = true;
    if (hasPoll) query.poll = { $exists: true, $ne: null };

    // Filtros de tipo de contenido
    if (contentType) {
      query["content.type"] = contentType;
    }

    // Filtros de rango para likes
    if (minLikes !== undefined || maxLikes !== undefined) {
      query.likes = {};
      if (minLikes !== undefined) query.likes.$gte = minLikes;
      if (maxLikes !== undefined) query.likes.$lte = maxLikes;
    }

    // Filtros de rango para views
    if (minViews !== undefined || maxViews !== undefined) {
      query.views = {};
      if (minViews !== undefined) query.views.$gte = minViews;
      if (maxViews !== undefined) query.views.$lte = maxViews;
    }

    // Filtros de fecha de publicación
    if (publishedAfter || publishedBefore) {
      query.publishedAt = {};
      if (publishedAfter) query.publishedAt.$gte = publishedAfter;
      if (publishedBefore) query.publishedAt.$lte = publishedBefore;
    }

    // Combinar todas las condiciones
    if (conditions.length > 0) {
      query.$and = conditions;
    }

    // Ordenamiento mejorado
    let sortOptions = {};
    if (sortBy === "popularity") {
      // Ordenamiento compuesto por popularidad
      sortOptions = { likes: -1, views: -1 };
    } else {
      sortOptions = { [sortBy]: sortDir === "asc" ? 1 : -1 };
    }

    // Optimización: Contar y buscar en paralelo
    const [total, posts] = await Promise.all([
      PostModel.countDocuments(query),
      PostModel.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("girl", "name username slug image") // Solo campos necesarios
        .exec(),
    ]);

    // Cálculo de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;

    return {
      data: posts.map((post) => mapper.toDomainPost(post)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
    };
  }
  async getPostById(id: string): Promise<PostEntity | null> {
    const post = await PostModel.findById(id)
        .populate('girl', 'name username slug image') // Solo campos necesarios
        .exec();
    return post ? mapper.toDomainPost(post) : null;
    }

  async getPostBySlug(slug: string): Promise<PostEntity | null> {
    const post = await PostModel.findOne({ slug })
      .populate("girl", "name username slug image") // Solo campos necesarios
      .exec();
    return post ? mapper.toDomainPost(post) : null;
  }

  async updatePost(
    id: string,
    postData: Partial<CreatePostInput>
  ): Promise<PostEntity | null> {
    const post = await PostModel.findByIdAndUpdate(id, postData, {
      new: true,
      runValidators: true,
    }).populate("girl", "name username slug image"); // Solo campos necesarios
    return post ? mapper.toDomainPost(post) : null;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await PostModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
