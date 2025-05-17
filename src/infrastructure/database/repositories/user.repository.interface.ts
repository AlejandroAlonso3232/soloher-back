
import { CreateUserDTO } from '../../../core/domain/schemas/user.schema';
import { UserEntity } from '../../../core/domain/entities/user.entity';



export interface IUserRepository {
  createUser(userData: CreateUserDTO): Promise<UserEntity>;
  getCurrentUser(id:string): Promise<UserEntity>;
  getUserByEmail(email: string): Promise<UserEntity | null>;
  updateUser(id: string, userData: Partial<UserEntity>): Promise<UserEntity | null>;
  deleteUser(id: string): Promise<boolean>;
}