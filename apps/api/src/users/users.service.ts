import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { phone } });
  }

  async upsertUser(payload: Prisma.UserCreateInput): Promise<User> {
    if (payload.email) {
      return this.prisma.user.upsert({
        where: { email: payload.email },
        create: payload,
        update: {
          phone: payload.phone ?? undefined,
        },
      });
    }

    if (payload.phone) {
      const existing = await this.findByPhone(payload.phone);
      if (existing) {
        return existing;
      }
    }

    return this.prisma.user.create({ data: payload });
  }
}
