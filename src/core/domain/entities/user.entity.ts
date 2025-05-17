import { UserRole } from '../schemas/user.schema';


export interface UserEntity {
    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    imageProfile?: string;
    secureUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;

    //Metodos de dominio
    // hasRole: (role: UserRole) => boolean;
}

export class User implements UserEntity {
    constructor(
        public id: string,
        public name: string,
        public email: string,
        public password: string,
        public role: UserRole,
        public imageProfile?: string,
        public secureUrl?: string,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
        public isActive: boolean = true
    ){}

    // hasRole(role: UserRole): boolean {
    //     return this.role === role;
    // }
}