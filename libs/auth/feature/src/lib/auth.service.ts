import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserDocument, UserRepository } from '@asistente/auth-data-access';
import {
  AuthTokens,
  JwtPayload,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from '@asistente/auth-model';
import * as bcrypt from 'bcrypt';

import { toSafeUser, SafeUser } from './user.mapper.js';
import { TokenService } from './token.service.js';

const SALT_ROUNDS = 12;

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const doc = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
    });

    const tokens = await this.tokenService.issueTokens(this.toPayload(doc));
    return { user: toSafeUser(doc), tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const doc = await this.userRepository.findByEmail(dto.email);
    if (!doc || !(await bcrypt.compare(dto.password, doc.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.tokenService.issueTokens(this.toPayload(doc));
    return { user: toSafeUser(doc), tokens };
  }

  async refresh(dto: RefreshTokenDto): Promise<{ tokens: AuthTokens }> {
    const payload = await this.tokenService.verifyRefresh(dto.refreshToken);
    const tokens = await this.tokenService.issueTokens({
      sub: payload.sub,
      email: payload.email,
    });
    return { tokens };
  }

  private toPayload(doc: UserDocument): JwtPayload {
    return { sub: doc._id.toString(), email: doc.email };
  }
}
