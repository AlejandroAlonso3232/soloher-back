import { CreateGirlDTO } from "../../core/domain/schemas/girl.schema";
import { GirlAlreadyExistsError, GirlNotFoundError } from "../../core/errors";
import { GetAllGirlsOptions, GirlRepository } from "../../infrastructure/database/repositories/girl.repository";
import { CloudinaryAdapter } from "../adapters/CloudinaryAdapter";
import slugify from "slugify";
import { S3Adapter } from "../adapters/s3.adapter";

export class GirlService {
  constructor(
    private readonly girlRepository: GirlRepository,
    private readonly cloudinaryAdapter: CloudinaryAdapter,
    private readonly s3Adapter: S3Adapter
  ) {}

  async createGirl(girlData: CreateGirlDTO): Promise<any> {
    // Verifica si la chica ya existe por username o nombre
    const existingGirl = await this.girlRepository.getGirlByUsernameToName(
      girlData.username,
      girlData.name
    );
    if (existingGirl) {
      throw new GirlAlreadyExistsError();
    }

    // Genera el slug a partir del nombre
    const slug = slugify(girlData.name, {
      lower: true,
      strict: true,
    });

    // Crea la chica en el repositorio
    return this.girlRepository.createGirl({
      ...girlData,
      slug,
    });
  }

  async getAllGirls(options: GetAllGirlsOptions = {}) {
    return this.girlRepository.getAllGirls(options) || [];
  }

  async getGirlById(id: string): Promise<any> {
    const girl = await this.girlRepository.getGirlById(id);

    if (!girl) {
      throw new GirlNotFoundError();
    }

    return girl;
  }

  async getGirlBySlug(slug: string): Promise<any> {
    const girl = await this.girlRepository.getGirlBySlug(slug);

    if (!girl) {
      throw new GirlNotFoundError();
    }

    return girl;
  }

  async updateGirl(
    id: string,
    girlData: Partial<CreateGirlDTO>,
    file?: any
  ): Promise<any> {
    //buscamos si la chica existe
    const existingGirl = await this.girlRepository.getGirlById(id);
    if (!existingGirl) {
      throw new GirlNotFoundError();
    }

    //extraemos todos los datos que se pueden actualizar
    const {
      name,
      username,
      description,
      image,

      views,
      status,
      likes,
      posts,
      age,
      country,
      tags,
      socials,
    } = girlData;

    // Verifica si el nombre o username ya existen en otra chica
    if (name || username) {
      const existingGirlByNameOrUsername =
        await this.girlRepository.getGirlByUsernameToName(
          username || existingGirl.username,
          name || existingGirl.name
        );
      if (
        existingGirlByNameOrUsername &&
        existingGirlByNameOrUsername.id !== id
      ) {
        throw new GirlAlreadyExistsError();
      }
    }

    //si el nombre cambia, generamos un nuevo slug
    let slug = existingGirl.slug;
    if (name && name !== existingGirl.name) {
      slug = slugify(name, {
        lower: true,
        strict: true,
      });
    }

    // Verifica si se está actualizando la imagen
    let imageUrl = existingGirl.image;
    let publicIdImage = existingGirl.publicId;
    //si el usuario ya tiene una imagen, la eliminamos de Cloudinary y subimos la nueva
    if (file) {
      if (existingGirl.publicId !== "") {
        await this.cloudinaryAdapter.delete(existingGirl.publicId);
      }
      const uploadResult = await this.s3Adapter.upload(file, {
        folder: `girl/${existingGirl.name}+${existingGirl.username}`,
      });

      //generamos una url optimizada
      const optimizedImage = await this.s3Adapter.generateUrl(
        uploadResult.publicId,
        {
          transformation: [
            { width: 500, height: 500, crop: "fill" },
            { quality: "auto" },
          ],
        }
      );

      imageUrl = optimizedImage;
      publicIdImage = uploadResult.publicId;
    }

    //creamos el objeto de actualización
    const updateData: Partial<CreateGirlDTO> = {
      name: name || existingGirl.name,
      username: username || existingGirl.username,
      slug,
      description: description || existingGirl.description,
      image: imageUrl,
      publicId: publicIdImage,
      views: views !== undefined ? views : existingGirl.views,
      status: status || existingGirl.status,
      likes: likes !== undefined ? likes : existingGirl.likes,
      posts: posts !== undefined ? posts : existingGirl.posts,
      age: age !== undefined ? age : existingGirl.age,
      country: country || existingGirl.country,
      tags: tags || existingGirl.tags,
      socials: {
        twitter: socials?.twitter || existingGirl.socials?.twitter || "",
        instagram: socials?.instagram || existingGirl.socials?.instagram || "",
        tiktok: socials?.tiktok || existingGirl.socials?.tiktok || "",
        youtube: socials?.youtube || existingGirl.socials?.youtube || "",
        onlyfans: socials?.onlyfans || existingGirl.socials?.onlyfans || "",
        fansly: socials?.fansly || existingGirl.socials?.fansly || "",
        other: socials?.other || existingGirl.socials?.other || "",
      },
    };

    // console.log(existingGirl);

    // Actualiza la chica en el repositorio
    const updatedGirl = await this.girlRepository.updateGirl(
      existingGirl.id,
      updateData
    );
    if (!updatedGirl) {
      throw new GirlNotFoundError();
    }
    // Retorna la chica actualizada
    return updatedGirl;
  }

  async deleteGirl(id: string): Promise<boolean> {
    const girl = await this.girlRepository.getGirlById(id);

    if (!girl) {
      throw new GirlNotFoundError();
    }

    // Si la chica tiene una imagen, la eliminamos de Cloud
    if (girl.publicId !== "") {
      (await this.cloudinaryAdapter.delete(girl.publicId)) as any;
    }

    const result = await this.girlRepository.deleteGirl(girl.id);

    if (!result) {
      throw new GirlNotFoundError();
    }
    return result;
  }
}
