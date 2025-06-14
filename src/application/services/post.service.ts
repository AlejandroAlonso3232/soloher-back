import slugify from "slugify";
import { PostEntity } from "../../core/domain/entities/post.entity";
import { CreatePostInput } from "../../core/domain/schemas/post.schema";
import {
  GetAllPostsOptions,
  PostRepository,
} from "../../infrastructure/database/repositories/post.repository";
import { S3Adapter } from "../adapters/s3.adapter";
import { ContentType } from "../../infrastructure/database/models/post.models";
import { GirlRepository } from "../../infrastructure/database/repositories/girl.repository";
import {
  FileUploadError,
  GirlNotFoundError,
  PostAlreadyExistsError,
  PostCreateError,
  PostNotFoundError,
  PostUpdateError,
} from "../../core/errors";

interface UploadedFile {
  name: string;
  data: Buffer;
  size: number;
  encoding: string;
  tempFilePath?: string;
  truncated: boolean;
  mimetype: string;
  md5: string;
  mv(path: string, callback: (err: any) => void): void;
  mv(path: string): Promise<void>;
}

export class PostService {
  constructor(
    private readonly postRepository: PostRepository, // Replace with actual PostRepository
    private readonly girlRepository: GirlRepository,
    private readonly s3Adapter: S3Adapter // Replace with actual S3Adapter or CloudinaryAdapter
  ) {}

  async createPost(
    postData: CreatePostInput,
    content: {
      image?: UploadedFile;
      video?: UploadedFile;
      type: ContentType | any;
    }
  ): Promise<PostEntity> {
    const existingPost = await this.postRepository.getGirltoTitle(
      postData.title
    );
    if (existingPost) {
      throw new PostAlreadyExistsError();
    }

    const { title, girl } = postData;
    const { type, image, video } = content;

    const existingGirl = await this.girlRepository.getGirlById(girl);

    if (!existingGirl) {
      throw new GirlNotFoundError();
    }

    let imagesPost = [];
    let VideosPost = [];
    if (type === ContentType.IMAGE && image) {
      // Upload image to S3 or Cloudinary
      const imageUpload = await this.s3Adapter.upload(image);
      if (!imageUpload) {
        throw new FileUploadError("Failed to upload image");
      }
      imagesPost.push({
        type: ContentType.IMAGE,
        url: imageUpload.secureUrl,
        thumbnail: imageUpload.secureUrl, // Assuming the same URL for
        imageCount: imagesPost.length, // Increment image count
        videoCount: VideosPost.length, // Keep video count
        order: 0, // Default order
      });
    }

    if (type === ContentType.VIDEO && video) {
      // Upload video to S3 or Cloudinary
      const videoUpload = await this.s3Adapter.upload(video);
      if (!videoUpload) {
        throw new FileUploadError("Failed to upload video");
      }
      VideosPost.push({
        type: ContentType.VIDEO,
        url: videoUpload.secureUrl,
        thumbnail: videoUpload.secureUrl, // Assuming the same URL for thumbnail
        order: 0, // Default order
      });
    }
    // Generate slug from title
    const slug = slugify(title, {
      lower: true,
      strict: true,
    });

    // Prepare post data
    const postDataWithSlug = {
      ...postData,
      slug: slug, // Use the generated
      content: [...imagesPost, ...VideosPost], // Combine images and videos
    };

    //crear la entidad Post
    const post = await this.postRepository.createPost(postDataWithSlug);
    if (!post) {
      throw new PostCreateError();
    }

    return post;
  }

  async getAllPosts(options: GetAllPostsOptions = {}): Promise<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    data: PostEntity[];
  }> {
    // Fetch all posts with the given options
    return this.postRepository.getAllPosts(options);
  }

  async getPostBySlug(slug: string): Promise<PostEntity | null> {
    // Fetch a post by its slug
    const post = await this.postRepository.getPostBySlug(slug);

    //aumentar las vistas del post por cada vez que se accede
    if (post) {
      post.views += 1;
      await this.postRepository.updatePost(post.id, post);
    }

    return post;
  }

  async updatePost(
    id: string,
    postData: Partial<CreatePostInput>,
    images: UploadedFile[],
    videos: UploadedFile[]
  ) {
    //obetener el post por id
    const post = await this.postRepository.getPostById(id);
    // Check if the post exists
    if (!post) {
      throw new PostNotFoundError();
    }
    console.log(postData.title);
    console.log("Images:", images);
    
    

    //checamos si estan mandando el titulo y si es asi checar que sea diferente al actual y que enn la base de datos no exista uno conn el mismo titulo
    if (postData.title) {
      const existingPost = await this.postRepository.getGirltoTitle(
        postData.title
      );

      console.log("Existing Post:", existingPost);
      
      if (existingPost && existingPost.id !== id) {
        throw new PostAlreadyExistsError();
      }

      post.title = postData.title;
      post.slug = slugify(postData.title, {
        lower: true,
        strict: true,
      });
    }

    // Update other fields
    post.description = postData.description || post.description;
    post.status = postData.status || post.status;
    post.visibility = postData.visibility || post.visibility;
    post.likes = postData.likes || post.likes;
    post.views = postData.views || post.views;
    post.shares = postData.shares || post.shares;
    post.comments = postData.comments || post.comments;
    post.bookmarks = postData.bookmarks || post.bookmarks;
    post.videoCount = postData.videoCount || post.videoCount;
    post.audioCount = postData.audioCount || post.audioCount;
    post.tags = postData.tags || post.tags;
    post.keywords = postData.keywords || post.keywords;
    post.metaDescription = postData.metaDescription || post.metaDescription;
    post.relatedPosts = postData.relatedPosts || post.relatedPosts;
    post.featuredIn = postData.featuredIn || post.featuredIn;
    post.scheduledAt = postData.scheduledAt || post.scheduledAt;
    post.publishedAt = postData.publishedAt || post.publishedAt;
    post.imageCount = post.imageCount += images.length;
    post.videoCount = post.videoCount += videos.length;

    // let imagesCount = 0;
    if (images) {
      // Process images if provided
      const imageUploads = await Promise.all(
        images.map(async (image: any) => {
          const uploadResult = await this.s3Adapter.upload(image);
          return {
            type: ContentType.IMAGE,
            url: uploadResult.secureUrl,
            thumbnail: uploadResult.secureUrl, // Assuming the same URL for thumbnail
            //aumentar el order en uno dependiendo de la cantidad de imagenes y video teniendo como prioridad las imagenes
            order: 0,
          };
          //subir el contador de imagenes
        })
      );
      // post.imageCount += imagesCount;
      post.content.push(...imageUploads);
    }

    // let videosCount = 0;

    if (videos) {
      // Process videos if provided
      const videoUploads = await Promise.all(
        videos.map(async (video: any) => {
          const uploadResult = await this.s3Adapter.upload(video);
          return {
            type: ContentType.VIDEO,
            url: uploadResult.secureUrl,
            thumbnail: uploadResult.secureUrl, // Assuming the same URL for thumbnail
            order: 0, // Default order
          };
          //subir el contador de videos
          // videosCount++;
        })
      );
      // post.videoCount += videosCount;
      post.content.push(...videoUploads);
    }

    const updatedPost = await this.postRepository.updatePost(id, post);
    if (!updatedPost) {
      throw new PostUpdateError();
    }

    return updatedPost;
  }

  async deleteContent(id: string, contentUrl: string) {
    const post = await this.postRepository.getPostById(id);
    if (!post) {
      throw new PostNotFoundError();
    }

    //obtener el contenido filtrando por url
    const contentIdex = post.content.findIndex(
      (item) => item.url === contentUrl
    );

    // console.log("Content Index:", contentIdex);
    if (contentIdex === -1) {
      throw new PostNotFoundError();
    }

    // Eliminar el contenido del post
    post.content.splice(contentIdex, 1);

    // https://goodnes.s3.us-east-2.amazonaws.com/goodnes-girls/1749504339347-9bz2c0.mp4
    // goodnes-girls/1749504339347-9bz2c0.mp4 obtener esto
    const publicId = contentUrl.split("/").slice(3).join("/");

    console.log(publicId);
    //eliminar el contenido del s3 o cloudinary
    try {
      await this.s3Adapter.delete(publicId!);
    } catch (error: any) {
      throw new FileUploadError(
        `Failed to delete content from storage: ${error.message}`
      );
    }

    // Actualizar el post en la base de datos
    const updatedPost = await this.postRepository.updatePost(id, post);
    if (!updatedPost) {
      throw new PostUpdateError();
    }

    return updatedPost;
  }

  // async deletePost(id: string): Promise<boolean> {
  //   // Delete the post by its ID
  //   return this.postRepository.deletePost(id);
  // }
}
