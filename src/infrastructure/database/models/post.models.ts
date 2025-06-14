import mongoose, { Document, Schema, Types } from "mongoose";
import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";
import { PostEntity } from "../../../core/domain/entities/post.entity";

export interface PostDocument extends Omit<PostEntity, "id">, Document {}

export enum ContentType {
  IMAGE = "image",
  VIDEO = "video",
  TEXT = "text",
  AUDIO = "audio",
  EMBED = "embed",
  POLL = "poll",
}

export enum PostStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
  DELETED = "deleted",
}

export enum Visibility {
  PUBLIC = "public",
  PRIVATE = "private",
  FOLLOWERS = "followers",
  SUBSCRIBERS = "subscribers",
}

export interface ContentItem {
  type: ContentType;
  url: string;
  thumbnail?: string;
  caption?: string;
  duration?: number; // En segundos para videos/audio
  width?: number; // Dimensiones para imágenes/videos
  height?: number;
  order: number; // Orden en galerías
}

export interface PollOption {
  text: string;
  votes: number;
}

export interface IPost extends Document {
  title: string;
  slug: string;
  description?: string;
  content: ContentItem[];
  status: PostStatus;
  visibility: Visibility;
  girl: Types.ObjectId;

  // Engagement metrics
  likes: number;
  views: number;
  shares: number;
  comments: number;
  bookmarks: number;

  // Multimedia counters
  imageCount: number;
  videoCount: number;
  audioCount: number;

  // Poll data
  poll?: {
    question: string;
    options: PollOption[];
    endsAt: Date;
    totalVotes: number;
  };

  // SEO & discoverability
  tags: string[];
  keywords: string[];
  metaDescription?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledAt?: Date;

  // Relations
  relatedPosts: Types.ObjectId[];
  featuredIn: Types.ObjectId[]; // Colecciones donde aparece
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    content: [
      {
        type: {
          type: String,
          enum: Object.values(ContentType),
          required: true,
        },
        url: { type: String, required: true },
        thumbnail: String,
        caption: String,
        duration: Number,
        width: Number,
        height: Number,
        order: Number,
      },
    ],
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.DRAFT,
    },
    visibility: {
      type: String,
      enum: Object.values(Visibility),
      default: Visibility.PUBLIC,
    },
    girl: { type: Schema.Types.ObjectId, ref: "Girl", required: true },
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    imageCount: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
    audioCount: { type: Number, default: 0 },
    poll: {
      question: { type: String, required: false },
      options: [
        {
          text: { type: String, required: true },
          votes: { type: Number, default: 0 },
        },
      ],
      endsAt: { type: Date, required: false },
      totalVotes: { type: Number, default: 0 },
    },
    tags: [{ type: String }],
    keywords: [{ type: String }],
    metaDescription: String,
    publishedAt: Date,
    scheduledAt: Date,
    relatedPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    featuredIn: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
  },
  { timestamps: true }
);

// Middleware (Hooks) con .pre()
PostSchema.pre<IPost>("save", function (next) {
  // Generar slug automáticamente
  

  // Actualizar contadores multimedia
  if (this.isModified("content")) {
    this.imageCount = this.content.filter(
      (item) => item.type === ContentType.IMAGE
    ).length;
    this.videoCount = this.content.filter(
      (item) => item.type === ContentType.VIDEO
    ).length;
    this.audioCount = this.content.filter(
      (item) => item.type === ContentType.AUDIO
    ).length;
  }

  // Establecer publishedAt cuando se publica
  if (
    this.isModified("status") &&
    this.status === PostStatus.PUBLISHED &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

//agregar el titulo a los tags
PostSchema.pre<IPost>("save", function (next) {
  if (this.isModified("title") && this.title) {
    const titleTags = this.title.split(" ").map((word) => word.toLowerCase());
    this.tags = Array.from(new Set([...this.tags, ...titleTags])); // Evitar duplicados
  }

  next();
});

// Índices para mejorar el rendimiento
PostSchema.index({ slug: 1 });
PostSchema.index({ status: 1, publishedAt: -1 });
PostSchema.index({ girl: 1, status: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ scheduledAt: 1 });

export const PostModel = mongoose.model<IPost>("Post", PostSchema);
