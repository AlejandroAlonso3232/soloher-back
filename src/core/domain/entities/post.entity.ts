import { ContentItem, PostStatus, Visibility } from "../../../infrastructure/database/models/post.models";


export interface PostItem {
    id: string;
    title: string;
    slug: string;
    description?: string;
    content: ContentItem[];
    status: PostStatus;
    visibility: Visibility;
    girl: string;
    likes?: number;
    views?: number;
    shares?: number;
    comments?: number;
    bookmarks?: number;
    imageCount?: number;
    videoCount?: number;
    audioCount?: number;
    poll?: {
        question: string;
        options: { text: string; votes: number }[];
        endsAt: Date;
        totalVotes?: number;
    };
    tags?: string[];
    keywords?: string[];
    metaDescription?: string;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    scheduledAt?: Date;
    relatedPosts?: string[];
    featuredIn?: string[]; // Colecciones donde aparece

}

export class PostEntity implements PostItem {
    constructor(
        public id: string,
        public title: string,
        public slug: string,
        public girl: string,
        public description?: string,
        public content: ContentItem[] = [],
        public status: PostStatus = PostStatus.DRAFT,
        public visibility: Visibility = Visibility.PUBLIC, 
        public likes: number = 0,
        public views: number = 0,
        public shares: number = 0,
        public comments: number = 0,
        public bookmarks: number = 0,
        public imageCount: number = 0,
        public videoCount: number = 0,
        public audioCount: number = 0,
        public poll?: {
            question: string;
            options: { text: string; votes: number }[];
            endsAt: Date;
            totalVotes?: number;
        },
        public tags: string[] = [],
        public keywords: string[] = [],
        public metaDescription?: string,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
        public publishedAt?: Date,
        public scheduledAt?: Date,
        public relatedPosts: string[] = [],
        public featuredIn: string[] = []
    ) {}
    // Métodos adicionales pueden ser añadidos aquí

    
}