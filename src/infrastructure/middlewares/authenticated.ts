// src/infrastructure/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../../core/config/app.config';
import { UnauthorizedError, ForbiddenError } from '../../core/errors';
import { IUserRepository } from '../database/repositories/user.repository.interface';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      role: string;
      isActive: boolean;
    };
  }
}

export class AuthMiddleware {
  constructor(private readonly userRepository: IUserRepository) {}

  async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const token = this.extractToken(req);
      const payload = this.verifyToken(token);
      const user = await this.validateUser(payload);
      
      this.checkUserStatus(user);
      this.attachUserToRequest(req, user);
      
      next();
    } catch (error) {
      // console.log(error);
      
      this.handleAuthError(error, res);
    }
  }

  private extractToken(req: Request): string {
    const [scheme, token] = req.headers.authorization?.split(' ') || [];
    
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
      throw new UnauthorizedError();
    }
    
    return token;
  }

  private verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET!) as JwtPayload;
    } catch (error) {
      console.log(error);
      
      throw new UnauthorizedError();
    }
  }

  private async validateUser(payload: JwtPayload) {
    // console.log(payload);
    
    if (!payload.id) throw new UnauthorizedError();
    
    const user = await this.userRepository.getCurrentUser(payload.id);
    if (!user) throw new UnauthorizedError();
    
    return user;
  }

  private checkUserStatus(user: { isActive: boolean }) {
    if (!user.isActive) throw new ForbiddenError();
  }

  private attachUserToRequest(req: Request, user: any) {
    req.user = {
      id: user.id,
      role: user.role,
      isActive: user.isActive
    };
  }

  private handleAuthError(error: unknown | any, res: Response) {
    if (error instanceof UnauthorizedError) {
      // console.log(error);
      
      return res.status(401).json({ error: error.message });
    }
    if (error instanceof ForbiddenError) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error de autenticación' });
  }
}