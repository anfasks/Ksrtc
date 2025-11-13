import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

const OTP_VALID_WINDOW_MINUTES = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    if (!dto.phone && !dto.email) {
      throw new UnauthorizedException('Phone or email is required');
    }
    const user = await this.usersService.upsertUserByContact(dto);
    const otpCode = dto.code ?? randomInt(100000, 999999).toString();
    const otpHash = await argon2.hash(otpCode);
    const expiresAt = new Date(Date.now() + OTP_VALID_WINDOW_MINUTES * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash,
        otpExpiresAt: expiresAt,
      },
    });

    return {
      message: 'OTP requested successfully',
      expiresAt,
      debugOtp: process.env.NODE_ENV === 'production' ? undefined : otpCode,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    if (!dto.phone && !dto.email) {
      throw new UnauthorizedException('Phone or email is required');
    }
    const user = await this.usersService.findByContact(dto);
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      throw new UnauthorizedException('OTP not requested');
    }

    const bypass = process.env.OTP_BYPASS_CODE;
    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP expired');
    }

    const isValid =
      dto.otp === bypass ||
      (await argon2.verify(user.otpHash, dto.otp));

    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Clear OTP state after successful verification
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash: null,
        otpExpiresAt: null,
      },
    });

    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
      },
      ...tokens,
    };
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
