import { UserEntity } from "../../core/domain/entities/user.entity";
import { CreateUserDTO } from "../../core/domain/schemas/user.schema";
import { IUserRepository } from "../../infrastructure/database/repositories/user.repository.interface";
import { BcryptAdapter } from "../adapters/Bcrypt";
import {
  InvalidCredentialsError,
  NoAdminRoleError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from "../../core/errors";
import { JWTAdapter } from "../adapters/JWTAdapter";
import { S3Adapter } from "../adapters/s3.adapter";
import { MegaAdapter } from "../adapters/MegaAdapter";

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly bcryptAdapter: BcryptAdapter,
    private readonly jwtAdapter: JWTAdapter,
    private readonly s3Adapter: S3Adapter, // Solo usamos S3 ahora
    private readonly megaAdapter?: MegaAdapter
  ) {}

  async registerUser(userData: CreateUserDTO): Promise<UserEntity | any> {
    const existingUser = await this.userRepository.getUserByEmail(
      userData.email
    );
    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

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
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const token = this.jwtAdapter.generateToken(user, "30d");

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
        | "username"
        | "email"
        | "password"
        | "role"
        | "imageProfile"
        | "secureUrl"
        | "isActive"
        | "imageExtension"
      >
    >,
    file:any
  ): Promise<UserEntity | null> {
    const existingUser = await this.userRepository.getCurrentUser(userId);
    if (!existingUser) {
      throw new UserNotFoundError();
    }
    // console.log("Datos de actualización:", updateData);

    const { name, username, email, password, role, imageProfile, isActive } =
      updateData;

    let newEmail = existingUser.email;
    if (email) {
      const existingEmail = await this.userRepository.getUserByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new UserAlreadyExistsError();
      }
      newEmail = email;
    }

    const newName = name || existingUser.name;
    const newUsername = username || existingUser.username;
    let newPassword;
    if (password) {
      const hashedPassword = await this.bcryptAdapter.hash(password);
      newPassword = hashedPassword;
    }

    let newRole = existingUser.role;
    if (role) {
      if (existingUser.role !== "admin") {
        throw new NoAdminRoleError();
      }
      newRole = role;
    }
    const newIsActive =
      isActive !== undefined ? isActive : existingUser.isActive;

    let newimageProfileUrl = existingUser.imageProfile;
    let newsecureUrl = existingUser.secureUrl;

    console.log(imageProfile);

    // Manejo de imágenes con S3
    if (file) {
      //checamos si tiene una imagen actualmente
      if (existingUser.secureUrl !== "") {
        //borramos la imagen de cloudinary

        await this.s3Adapter.delete(
          existingUser.secureUrl!
        );
        // console.log(resultDelete);

        //subir la nueva imagen a cloudinary
        const result = (await this.s3Adapter.upload(file)) as any;

        // console.log(result);
        const urlGenerated = await this.s3Adapter.generateUrl(result.publicId, {
          transformation: [
            { width: 300, height: 300, crop: "fill" },
            { quality: "auto" },
          ],
        });

        newimageProfileUrl = urlGenerated;
        newsecureUrl = result.publicId;
      } else {
        //subir la nueva imagen a cloudinary
        const result = (await this.s3Adapter.upload(file)) as any;

         const urlGenerated = await this.s3Adapter.generateUrl(result.publicId, {
          transformation: [
            { width: 300, height: 300, crop: "fill" },
            { quality: "auto" },
          ],
        });

        newimageProfileUrl = urlGenerated;
        newsecureUrl = result.publicId;
      }
    }

    const objectToUpdate = {
      name: newName,
      username: newUsername,
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
