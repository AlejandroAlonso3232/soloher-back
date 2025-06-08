// src/core/utils/mapper.ts
import { GirlDocument } from "../../infrastructure/database/models/girl.model";
import { UserDocument } from "../../infrastructure/database/models/user.model";
import { GirlEntity } from "../domain/entities/girl.entity";
import { PostEntity } from "../domain/entities/post.entity";
import { UserEntity } from "../domain/entities/user.entity";

export const mapper = {
  toDomain(user: UserDocument | any): UserEntity {
    return {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role,
      imageProfile: user.imageProfile,
      secureUrl: user.secureUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isActive: user.isActive,
      // hasRole: (role) => user.role === role
    };
  },

  toDomainGirl(girl: GirlDocument | any): GirlEntity {
    return {
      id: girl._id.toString(),
      name: girl.name,
      username: girl.username,
      slug: girl.slug,
      description: girl.description,
      image: girl.image,
      publicId: girl.publicId,
      views: girl.views || 0,
      status: girl.status || "privado",
      likes: girl.likes || 0,
      posts: girl.posts || 0,
      age: girl.age,
      country: girl.country,
      tags: girl.tags || [],
      socials: {
        twitter: girl.socials?.twitter || "",
        instagram: girl.socials?.instagram || "",
        tiktok: girl.socials?.tiktok || "",
        youtube: girl.socials?.youtube || "",
        onlyfans: girl.socials?.onlyfans || "",
        fansly: girl.socials?.fansly || "",
        other: girl.socials?.other || "",
      },
      createdAt: girl.createdAt,
      updatedAt: girl.updatedAt,
    };
  },
  toDomainPost(post: any | any): PostEntity {
    return {
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      description: post.description,
      content: post.content.map((item: any): any => ({
        type: item.type,
        url: item.url,
        thumbnail: item.thumbnail,
        caption: item.caption,
        duration: item.duration,
        width: item.width,
        height: item.height,
        order: item.order,
      })),
      status: post.status,
      visibility: post.visibility,
      girl: post.girl.toString(), // Convertir ObjectId a string
      likes: post.likes || 0,
      views: post.views || 0,
      shares: post.shares || 0,
      comments: post.comments || 0,
      bookmarks: post.bookmarks || 0,
      imageCount: post.imageCount || 0,
      videoCount: post.videoCount || 0,
      audioCount: post.audioCount || 0,
      poll: post.poll
        ? {
            question: post.poll.question,
            options: post.poll.options.map((opt: any): any => ({
              text: opt.text,
              votes: opt.votes || 0,
            })),
            endsAt: post.poll.endsAt,
            totalVotes: post.poll.totalVotes || 0,
          }
        : undefined,
      tags: post.tags || [],
      keywords: post.keywords || [],
      metaDescription: post.metaDescription,

      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt,
      scheduledAt: post.scheduledAt,
      relatedPosts: post.relatedPosts?.map((id: any) => id.toString()) || [],
      featuredIn: post.featuredIn?.map((id: any) => id.toString()) || [],
    };
  },

  
};
