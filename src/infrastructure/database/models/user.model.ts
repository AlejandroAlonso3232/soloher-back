import mongoose, { Document, Schema } from "mongoose";
import { UserEntity } from '../../../core/domain/entities/user.entity';
import bcrypt from 'bcryptjs';

export interface UserDocument extends Omit<UserEntity, 'id'>, Document {
    comparePassword(candidatePassword: string):Promise<boolean>;
}

const UserSchema = new Schema<UserDocument>({
    name: { type: String, required: true },
     email: { 
      type: String, 
      required: true, 
      unique: true,
      index: true,
      validate: {
        validator: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        message: 'Email inválido'
      }
    },
    password: { 
      type: String, 
      required: true,
      select: false 
    },
    imageProfile: {
        type:String
    },
    secureUrl: {
        type:String
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'moderator'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },

},
{
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: (_, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password; // Eliminar la contraseña del objeto JSON
        }
    }
})

UserSchema.pre<UserDocument>('save', async function(next) {
    if(!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
}

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);