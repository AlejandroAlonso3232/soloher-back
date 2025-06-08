import mongoose, { Document, Schema } from "mongoose";
import { GirlEntity } from "../../../core/domain/entities/girl.entity";

export interface GirlDocument extends Omit<GirlEntity, "id">, Document {}

const girlSchema = new Schema<GirlDocument>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    publicId: { type: String, default: "" },
    views: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["publico", "privado", "eliminado"],
      default: "privado",
    },
    likes: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    age: { type: Number, min: 0, max: 120, default: null },
    country: { type: String, maxlength: 50, default: "" },
    tags: { type: [String], default: [] },
    socials: {
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      youtube: { type: String, default: "" },
      onlyfans: { type: String, default: "" },
      fansly: { type: String, default: "" },
      other: { type: String, default: "" },
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
      },
    },
  }
);

//metodo para agregar el nombre, la edad y el pais a los tags automaticamente
girlSchema.pre<GirlDocument>("save", function (next) {
  if (
    this.isModified("name") ||
    this.isModified("age") ||
    this.isModified("country") ||
    this.isModified("username")
  ) {
    const tags = [];
    if (this.name) tags.push(this.name);
    if (this.age !== null) tags.push(`Edad: ${this.age}`);
    if (this.country) tags.push(this.country);
    if (this.username) tags.push(this.username);
    this.tags = Array.from(new Set(tags)); // Eliminar duplicados
  }
  next();
});

// En tu modelo, después de definir el schema
girlSchema.index({ name: 'text', tags: 'text', username: 'text' });
girlSchema.index({ status: 1, country: 1 });
girlSchema.index({ age: 1, likes: -1 });

export const GirlModel = mongoose.model<GirlDocument>("Girl", girlSchema);
