import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ImportBookingsDto } from './dto/import-bookings.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async import(dto: ImportBookingsDto) {
    if (!dto.bookings.length) {
      throw new BadRequestException('Bookings payload cannot be empty');
    }

    const results = [];
    for (const booking of dto.bookings) {
      const journey = await this.prisma.journey.findUnique({ where: { id: booking.journeyId } });
      if (!journey) {
        throw new NotFoundException(`Journey ${booking.journeyId} not found`);
      }

      const user = await this.usersService.upsertUserByContact({
        phone: booking.user.phone,
        email: booking.user.email,
      });

      const upserted = await this.prisma.booking.upsert({
        where: { bookingId: booking.bookingId },
        update: {
          pnr: booking.pnr,
          userId: user.id,
          journeyId: journey.id,
          seatNo: booking.seatNo,
          status: booking.status,
        },
        create: {
          bookingId: booking.bookingId,
          pnr: booking.pnr,
          userId: user.id,
          journeyId: journey.id,
          seatNo: booking.seatNo,
          status: booking.status,
        },
        include: {
          journey: true,
        },
      });

      results.push(upserted);
    }

    return {
      count: results.length,
      bookings: results,
    };
  }

  findMany() {
    return this.prisma.booking.findMany({
      include: {
        journey: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
