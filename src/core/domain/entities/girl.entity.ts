import { GirlStatus } from "../schemas/girl.schema";


export interface GirlEntity {
    id:string;
    name: string;
    username: string;
    slug: string;
    description?: string;
    image?: string;
    publicId?: string;
    views?: number;
    status: GirlStatus;
    likes?: number;
    posts?: number;
    age?: number;
    country?: string;
    tags?: string[];
    socials?: {
        twitter?: string;
        instagram?: string;
        tiktok?: string;
        youtube?: string;
        onlyfans?: string;
        fansly?: string;
        other?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export class Girl implements GirlEntity {
    constructor(
        public id: string,
        public name: string,
        public username: string,
        public slug: string,
        public description?: string,
        public image?: string,
        public publicId?: string,
        public views: number = 0,
        public status: GirlStatus = "privado",
        public likes: number = 0,
        public posts: number = 0,
        public age?: number,
        public country?: string,
        public tags: string[] = [],
        public socials?: {
            twitter?: string;
            instagram?: string;
            tiktok?: string;
            youtube?: string;
            onlyfans?: string;
            fansly?: string;
            other?: string;
        },
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) {}
}