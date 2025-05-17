import jwt, { Secret } from "jsonwebtoken";

export class JWTAdapter {
    constructor(private readonly secret: Secret) {}
    
    generateToken(payload: object, expiresIn: number | any): string {
        const options: jwt.SignOptions = { expiresIn };
        return jwt.sign(payload, this.secret, options);
    }
    
    verifyToken(token: string): string | jwt.JwtPayload {
        try {
            return jwt.verify(token, this.secret);
        } catch (error) {
            throw new Error("Invalid token");
        }
    }
}