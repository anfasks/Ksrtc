import {
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpStore } from './otp.store';

interface JwtPayload {
  sub: string;
  email?: string | null;
  phone?: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly otpStore: OtpStore,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; devOtp: string }> {
    const contact = dto.phone ?? dto.email;
    if (!contact) {
      throw new UnprocessableEntityException('phone or email is required');
    }

    const otp = this.generateOtp();
    const ttl = this.configService.get<number>('app.otpExpirySeconds', 300);
    this.otpStore.set(contact, otp, ttl);
    this.logger.log(`OTP issued for ${contact}`);

    // In production this would trigger SMS/email. For dev we return the OTP.
    return {
      message: 'OTP issued. Use verify endpoint to exchange for tokens.',
      devOtp: otp,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthTokens> {
    const contact = dto.phone ?? dto.email;
    if (!contact) {
      throw new UnprocessableEntityException('phone or email is required');
    }

    const isValid = this.otpStore.verify(contact, dto.otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.ensureUser(dto);
    return this.issueTokens(user);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  private async ensureUser(dto: VerifyOtpDto): Promise<User> {
    return this.usersService.upsertUser({
      email: dto.email,
      phone: dto.phone,
    });
  }

  private issueTokens(user: User): AuthTokens {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
    };

    const expiresInSeconds = this.parseExpiresInToSeconds(
      this.configService.get<string>('app.jwtExpiresIn', '1d'),
    );

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private parseExpiresInToSeconds(expr: string): number {
    const match = expr.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 86400;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
      default:
        return value * 86400;
    }
  }
}
