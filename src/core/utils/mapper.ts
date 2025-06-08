// src/core/utils/mapper.ts
import { GirlDocument } from "../../infrastructure/database/models/girl.model";
import { UserDocument } from "../../infrastructure/database/models/user.model";
import { GirlEntity } from "../domain/entities/girl.entity";
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
};
