import { Girl } from '../domain/entities/girl.entity';


// errors.ts
export class UserAlreadyExistsError extends Error {
    constructor() {
        super('User already exists');
        this.name = 'UserAlreadyExistsError';
    }
}

export class InvalidCredentialsError extends Error {
    constructor() {
        super('Invalid credentials');
        this.name = 'InvalidCredentialsError';
    }
}

export class UserNotFoundError extends Error {
    constructor() {
        super('User not found');
        this.name = 'UserNotFoundError';
    }
}

export class UnauthorizedError extends Error {
    constructor() {
        super('Unauthorized');
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    constructor() {
        super('Forbidden');
        this.name = 'ForbiddenError';
    }
}

export class NoAdminRoleError extends Error {
    constructor() {
        super('No credential admin role');
        this.name = 'NoAdminRoleError';
    }
}

export class CloudinaryError extends Error {
  constructor(
    public code: 'UPLOAD_FAILED' | 'DELETE_FAILED' | 'CONFIG_ERROR',
    message: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
  }
}

export class GirlAlreadyExistsError extends Error {
  constructor() {
    super('Girl already exists');
    this.name = 'GirlAlreadyExistsError';
    }
}
export class GirlNotFoundError extends Error {
  constructor() {
    super('Girl not found');
    this.name = 'GirlNotFoundError';
  }
}
export class GirlUpdateError extends Error {
    constructor() {
        super('Error updating')
        this.name = 'GirlUpdateError';
    }}

export class GirlDeleteError extends Error {
    constructor() {
        super('Error deleting')
        this.name = 'GirlDeleteError';
    }
}

export class GirlCreateError extends Error {
    constructor() {
        super('Error creating')
        this.name = 'GirlCreateError';
    }
}

