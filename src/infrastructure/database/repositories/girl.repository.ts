import { PostEntity } from "../../../core/domain/entities/post.entity";
import { CreateGirlDTO } from "../../../core/domain/schemas/girl.schema";
import { mapper } from "../../../core/utils/mapper";
import { GirlDocument, GirlModel } from "../models/girl.model";



// Definir tipo para opciones de búsqueda
export type GetAllGirlsOptions = {
  page?: number;
  limit?: number;
  sortBy?: keyof GirlDocument | string;
  sortDir?: "asc" | "desc";
  searchTerm?: string;
  status?: "publico" | "privado" | "eliminado";
  country?: string;
  minAge?: number;
  maxAge?: number;
};

export class GirlRepository {
  async createGirl(girlData: CreateGirlDTO): Promise<any> {
    const girl = await GirlModel.create(girlData);
    if (!girl) throw new Error("Failed to create girl");
    return mapper.toDomainGirl(girl);
  }

  async getGirlByUsernameToName(
    username: string,
    name: string
  ): Promise<any | null> {
    const girl = await GirlModel.findOne({ $or: [{ username }, { name }] });
    return girl ? mapper.toDomainGirl(girl) : null;
  }

  async getGirlById(id: string): Promise<any | null> {
    const girl = await GirlModel.findById(id);
    return girl ? mapper.toDomainGirl(girl) : null;
  }

  async getAllGirls(options: GetAllGirlsOptions = {}): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  }> {
    //valores por defecto
    const {
      page = 1,
      limit = 9,
      sortBy = "createdAt",
      sortDir = "desc",
      searchTerm = "",
      status,
      country,
      minAge,
      maxAge,
    } = options;

    //construir consulta de busqueda
    const query: any = {};

    //busuqeda por termino (incluye tags)
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { username: { $regex: searchTerm, $options: "i" } },
        { slug: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { tags: { $regex: searchTerm, $options: "i" } },
      ];
    }

    //filtros adicionales
    if (status) query.status = status;
    if (country) query.country = country;
    if (minAge !== undefined || maxAge !== undefined) {
      query.age = {};
      if (minAge !== undefined) query.age.$gte = minAge;
      if (maxAge !== undefined) query.age.$lte = maxAge;
    }

    //obtener total de documentos
    const total = await GirlModel.countDocuments(query);

    //calcular paginacion
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    //configurar ordenamiento
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortDir === "asc" ? 1 : -1,
    };

    //Si se ordena por un campo virtual o compuesto
    const sort =
      sortBy === "popularity" ? { likes: -1, views: -1 } : (sortOptions as any);

    //ejecutar consulta
    const girls = await GirlModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return {
      data: girls.map((girl) => mapper.toDomainGirl(girl)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    };
  }

  async getGirlBySlug(slug: string): Promise<any | null> {
    const girl = await GirlModel.findOne({ slug });
    return girl ? mapper.toDomainGirl(girl) : null;
  }

  async updateGirl(
    id: string,
    girlData: Partial<CreateGirlDTO>
  ): Promise<any | null> {
    const girl = await GirlModel.findByIdAndUpdate(id, girlData, {
      new: true,
      runValidators: true,
    });
    return girl ? mapper.toDomainGirl(girl) : null;
  }

  async deleteGirl(id: string): Promise<boolean> {
    const result = await GirlModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
