import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { AuthenticatedUser } from '@asistente/shared-types';

interface RequestWithUser {
  user: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
