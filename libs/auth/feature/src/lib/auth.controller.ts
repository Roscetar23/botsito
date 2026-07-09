import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRepository } from '@asistente/auth-data-access';
import { AuthTokens, LoginDto, RefreshTokenDto, RegisterDto } from '@asistente/auth-model';
import type { AuthenticatedUser } from '@asistente/shared-types';

import { AuthService, AuthResult } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { SafeUser, toSafeUser } from './user.mapper.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<{ tokens: AuthTokens }> {
    return this.authService.refresh(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<SafeUser> {
    const doc = await this.userRepository.findById(user.userId);
    if (!doc) {
      throw new NotFoundException('User not found');
    }
    return toSafeUser(doc);
  }
}
