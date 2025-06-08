import slugify from "slugify";
import { PostEntity } from "../../core/domain/entities/post.entity";
import { CreatePostInput } from "../../core/domain/schemas/post.schema";
import {
  GetAllPostsOptions,
  PostRepository,
} from "../../infrastructure/database/repositories/post.repository";
import { S3Adapter } from "../adapters/s3.adapter";
import { ContentType } from "../../infrastructure/database/models/post.models";

export class PostService {
  constructor(
    private readonly postRepository: PostRepository, // Replace with actual PostRepository
    private readonly s3Adapter: S3Adapter // Replace with actual S3Adapter or CloudinaryAdapter
  ) {}

  async createPost(
    postData: CreatePostInput,
    content: { image?: any; video?: any; type: ContentType }
  ): Promise<PostEntity> {
    const existingPost = await this.postRepository.getGirltoTitle(
      postData.title
    );
    if (existingPost) {
      throw new Error("Post with this title already exists");
    }

    const { title, girl } = postData;
    const { type, image, video } = content;

    let imagesPost = [];
    let VideosPost = [];
    if (type === ContentType.IMAGE && image) {
      // Upload image to S3 or Cloudinary
      const imageUpload = await this.s3Adapter.upload(image);
      if (!imageUpload) {
        throw new Error("Failed to upload image");
      }
      imagesPost.push({
        type: ContentType.IMAGE,
        url: imageUpload.secureUrl,
        thumbnail: imageUpload.secureUrl, // Assuming the same URL for
        order: 0, // Default order
      });
    }

    if (type === ContentType.VIDEO && video) {
      // Upload video to S3 or Cloudinary
      const videoUpload = await this.s3Adapter.upload(video);
      if (!videoUpload) {
        throw new Error("Failed to upload video");
      }
      VideosPost.push({
        type: ContentType.VIDEO,
        url: videoUpload.secureUrl,
        thumbnail: videoUpload.secureUrl, // Assuming the same URL for thumbnail
        order: 0, // Default order
      });
    }
    // Generate slug from title

    // Prepare post data
    const postDataWithSlug = {
      ...postData,
      content: [...imagesPost, ...VideosPost], // Combine images and videos
    };

    //crear la entidad Post
    const post = await this.postRepository.createPost(postDataWithSlug);
    if (!post) {
      throw new Error("Failed to create post");
    }

    return post;
  }

  async getAllPosts(options: GetAllPostsOptions = {}): Promise<{
    data: PostEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  }> {
    // Fetch all posts with the given options
    return this.postRepository.getAllPosts(options);
  }

  async getPostBySlug(slug: string): Promise<PostEntity | null> {
    // Fetch a post by its slug
    const post = await this.postRepository.getPostBySlug(slug);
    return post;
  }

  //   async updatePost(
  //     id: string,
  //     postData: Partial<CreatePostInput>
  //   ): Promise<PostEntity | null> {
  //     const existingPost = await this.postRepository.getPostById(id);
  //     if (!existingPost) {
  //       throw new Error("Post not found");
  //     }

  //     const {
  //       audioCount,
  //       content,
  //       description,
  //       bookmarks,
  //       featuredIn,
  //       comments,
  //       girl,
  //       imageCount,
  //       likes,
  //       poll,
  //       publishedAt,
  //       relatedPosts,
  //       shares,
  //       status,
  //       tags,
  //       title,
  //       visibility,
  //       videoCount,
  //       keywords,
  //       metaDescription,
  //       scheduledAt,
  //     } = postData;

  //     //verificar si el title ya existe
  //     if (title) {
  //       const existingPostByTitle = await this.postRepository.getGirltoTitle(
  //         title
  //       );
  //       if (existingPostByTitle && existingPostByTitle.id !== id) {
  //         throw new Error("Post with this title already exists");
  //       }
  //     }
  //     //si el titulo cambia, actualizar el slug
  //     let slug= existingPost.slug;
  //     if(title && title !== existingPost.title) {
  //       slug = slugify(title, {
  //         lower: true,
  //         strict: true,
  //         });
  //     }

  //     // subir imagenes a s3

  //   }

  async deletePost(id: string): Promise<boolean> {
    // Delete the post by its ID
    return this.postRepository.deletePost(id);
  }
}
