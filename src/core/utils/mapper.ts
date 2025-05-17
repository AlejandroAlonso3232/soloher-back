// src/core/utils/mapper.ts
import { UserDocument } from '../../infrastructure/database/models/user.model';
import { UserEntity } from '../domain/entities/user.entity';

export const mapper = {
  toDomain(user: UserDocument | any): UserEntity {
    return {
      id: user._id.toString(),
      name: user.name,
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
  }
};