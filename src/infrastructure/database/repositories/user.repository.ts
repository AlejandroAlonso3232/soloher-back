import { UserEntity } from "../../../core/domain/entities/user.entity";
import { CreateUserDTO } from "../../../core/domain/schemas/user.schema";
import { mapper } from "../../../core/utils/mapper";
import { UserModel } from "../models/user.model";
import { IUserRepository } from "./user.repository.interface";



export class UserRepository implements IUserRepository {
    async createUser(userData: CreateUserDTO): Promise<UserEntity> {
        const user = await UserModel.create(userData);
        return mapper.toDomain(user);
    }

    async getCurrentUser(id: string): Promise<UserEntity> {
        const user = await UserModel.findById(id).select('+password');
        return mapper.toDomain(user);
    }

    async getUserByEmail(email: string): Promise<UserEntity | null> {
        const user = await UserModel.findOne({ email }).select('+password');
        return user ? mapper.toDomain(user) : null;
    }

    async updateUser(id: string, userData: Partial<CreateUserDTO>): Promise<UserEntity | null> {
        
        console.log(userData);
        
        const user = await UserModel.findByIdAndUpdate(id, {
            ...userData,
            role: userData.role || "user",
        }, {
        new : true,
        runValidators: true,
        })
        
        return user ? mapper.toDomain(user) : null;
    }

    async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}