import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { RequestOtpDto } from '../auth/dto/request-otp.dto';
import { VerifyOtpDto } from '../auth/dto/verify-otp.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async upsertUserByContact(contact: RequestOtpDto): Promise<User> {
    const { phone, email } = contact;
    if (!phone && !email) {
      throw new BadRequestException('Either phone or email is required');
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          phone ? { phone } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean) as Prisma.UserWhereInput[],
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.user.create({
      data: {
        phone,
        email,
      },
    });
  }

  async findByContact(contact: VerifyOtpDto) {
    const { phone, email } = contact;
    if (!phone && !email) {
      throw new BadRequestException('Either phone or email is required');
    }

    return this.prisma.user.findFirst({
      where: {
        OR: [
          phone ? { phone } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean) as Prisma.UserWhereInput[],
      },
    });
  }
}
