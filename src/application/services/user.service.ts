import { UserEntity } from "../../core/domain/entities/user.entity";
import { CreateUserDTO } from "../../core/domain/schemas/user.schema";
import { IUserRepository } from "../../infrastructure/database/repositories/user.repository.interface";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { BcryptAdapter } from "../adapters/Bcrypt";
import {
  InvalidCredentialsError,
  NoAdminRoleError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from "../../core/errors";
import { JWTAdapter } from "../adapters/JWTAdapter";
import { CloudinaryAdapter } from "../adapters/CloudinaryAdapter";

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly bcryptAdapter: BcryptAdapter,
    private readonly jwtAdapter: JWTAdapter,
    private readonly cloudinaryAdapter: CloudinaryAdapter
  ) {}

  async registerUser(userData: CreateUserDTO): Promise<UserEntity | any> {
    const existingUser = await this.userRepository.getUserByEmail(
      userData.email
    );
    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    // const hashedPassword = await this.bcryptAdapter.hash(userData.password);
    return this.userRepository.createUser({
      ...userData,
      role: "user",
    });
  }

  async loginUser(
    email: string,
    password: string
  ): Promise<{ user: UserEntity; token: string }> {
    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundError();
    }

    const isPasswordValid = await this.bcryptAdapter.compare(
      password,
      user.password
    );
    // console.log(isPasswordValid);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const token = this.jwtAdapter.generateToken(user, "1h");

    return { user, token };
  }

  async getUserProfile(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.getCurrentUser(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  async updateUserProfile(
    userId: string,
    updateData: Partial<
      Pick<
        UserEntity,
        | "name"
        | "email"
        | "password"
        | "role"
        | "imageProfile"
        | "secureUrl"
        | "isActive"
      >
    >
  ): Promise<UserEntity | null> {
    //buscamos si el usuario existe
    const existingUser = await this.userRepository.getCurrentUser(userId);
    if (!existingUser) {
      throw new UserNotFoundError();
    }

    const { name, email, password, role, imageProfile,  isActive } =
      updateData;

    // console.log(imageProfile);

    //verificamos si el email ya existe
    let newEmail = existingUser.email;
    if (email) {
      const existingEmail = await this.userRepository.getUserByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new UserAlreadyExistsError();
      }
      newEmail = email;
    }

    const newName = name || existingUser.name;
    let newPassword;
    if (password) {
      const hashedPassword = await this.bcryptAdapter.hash(password);
      newPassword = hashedPassword;
    }

    //aqui va la funcionalidad de la imagen

    let newRole = existingUser.role;
    if (role) {
      if (existingUser.role !== "admin") {
        throw new NoAdminRoleError();
      }
      newRole = role;
    }
    const newIsActive =
      isActive !== undefined ? isActive : existingUser.isActive;

    //verificamos que el nuevo email no exista

    let newimageProfileUrl = existingUser.imageProfile;
    let newsecureUrl = existingUser.secureUrl;

    if (imageProfile) {
      //checamos si tiene una imagen actualmente
      if (existingUser.imageProfile) {
        //borramos la imagen de cloudinary
        // const publicId = existingUser.imageProfile.split("/").pop()?.split(".")[0];

        const publicId = existingUser.secureUrl;
        await this.cloudinaryAdapter.delete(publicId!);

        //subir la nueva imagen a cloudinary
        const result = (await this.cloudinaryAdapter.upload(
          imageProfile
        )) as any;

        console.log(result);
        

        newimageProfileUrl = result.secure_url;
        newsecureUrl = result.public_id;
      } else {
        //subir la nueva imagen a cloudinary
        const result = (await this.cloudinaryAdapter.upload(
          imageProfile
        )) as any;

        console.log(result);
        

        newimageProfileUrl = result.secureUrl;
        newsecureUrl = result.publicId;
      }
    }

    const objectToUpdate = {
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      imageProfile: newimageProfileUrl,
      secureUrl: newsecureUrl,

      isActive: newIsActive,
      updatedAt: new Date(),
    };

    const updateUser = await this.userRepository.updateUser(
      userId,
      objectToUpdate
    );

    return updateUser;
  }

  async deactivateUser(userId: string): Promise<boolean> {

    //buscamos si el usuario existe
    const existingUser = await this.userRepository.getCurrentUser(userId);
    if (!existingUser) {
      throw new UserNotFoundError();
    }

    const result = await this.userRepository.updateUser(userId, {
      isActive: false,
      updatedAt: new Date(),
    });
    return !!result;
  }
}
