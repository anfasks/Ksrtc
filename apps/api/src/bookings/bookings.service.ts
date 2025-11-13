import {
  GoneException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JourneysService } from '../journeys/journeys.service';
import { JourneyDetailResponse } from '../journeys/dto/journey-response.dto';
import { BookingImportItemDto } from './dto/booking-import-item.dto';
import { ImportBookingsDto } from './dto/import-bookings.dto';

interface ImportResult {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly journeysService: JourneysService,
  ) {}

  async import(dto: ImportBookingsDto): Promise<ImportResult> {
    const items = this.resolveItems(dto);
    if (!items.length) {
      throw new UnprocessableEntityException('No bookings provided');
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      try {
        const before = await this.prisma.booking.findUnique({
          where: { bookingId: item.bookingId },
          select: { id: true },
        });
        await this.importSingle(item);
        if (before) {
          updated += 1;
        } else {
          created += 1;
        }
      } catch (error) {
        skipped += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to import booking ${item.bookingId}: ${message}`);
      }
    }

    return {
      processed: items.length,
      created,
      updated,
      skipped,
    };
  }

  async lookupByBooking(bookingId: string, userId: string): Promise<JourneyDetailResponse> {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId },
      select: {
        userId: true,
        journeyId: true,
      },
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    return this.resolveJourneyWithTracking(booking.journeyId, bookingId);
  }

  async lookupByPnr(pnr: string, userId: string): Promise<JourneyDetailResponse> {
    const booking = await this.prisma.booking.findUnique({
      where: { pnr },
      select: {
        userId: true,
        journeyId: true,
        bookingId: true,
      },
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    return this.resolveJourneyWithTracking(booking.journeyId, booking.bookingId);
  }

  private async importSingle(item: BookingImportItemDto): Promise<void> {
    const user = await this.usersService.upsertUser({
      email: this.emptyToUndefined(item.userEmail),
      phone: this.emptyToUndefined(item.userPhone),
    });

    const status = this.normalizeStatus(item.status);

    await this.prisma.booking.upsert({
      where: { bookingId: item.bookingId },
      create: {
        bookingId: item.bookingId,
        pnr: item.pnr,
        seatNo: item.seatNo,
        status: status ?? BookingStatus.CONFIRMED,
        user: { connect: { id: user.id } },
        journey: { connect: { id: item.journeyId } },
      },
      update: {
        pnr: item.pnr,
        seatNo: item.seatNo,
        status: status ?? undefined,
        journey: { connect: { id: item.journeyId } },
      },
    });
  }

  private normalizeStatus(status?: string | null): BookingStatus | undefined {
    if (!status) {
      return undefined;
    }

    const normalized = status.toUpperCase();
    if (normalized in BookingStatus) {
      return BookingStatus[normalized as keyof typeof BookingStatus];
    }
    return undefined;
  }

  private resolveItems(dto: ImportBookingsDto): BookingImportItemDto[] {
    if (dto.bookings?.length) {
      return dto.bookings;
    }

    if (dto.csv) {
      return this.parseCsv(dto.csv);
    }

    return [];
  }

  private parseCsv(csv: string): BookingImportItemDto[] {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      return [];
    }

    const headers = this.splitCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = this.splitCsvLine(line);
      const record = headers.reduce<Record<string, string>>((acc, header, index) => {
        acc[header] = values[index] ?? '';
        return acc;
      }, {});

      return {
        bookingId: record.bookingId,
        pnr: record.pnr,
        journeyId: record.journeyId,
        seatNo: record.seatNo || undefined,
        userEmail: record.userEmail || undefined,
        userPhone: record.userPhone || undefined,
        status: record.status || undefined,
      };
    });
  }

  private splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private emptyToUndefined(value?: string | null): string | undefined {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  private async resolveJourneyWithTracking(
    journeyId: string,
    bookingId: string,
  ): Promise<JourneyDetailResponse> {
    const detail = await this.journeysService.findDetailById(journeyId);
    if (!detail.trackingLink) {
      throw new GoneException({
        error: 'TrackingLinkMissing',
        message: `No active tracking link for booking ${bookingId}`,
        metadata: { journeyId },
      });
    }

    if (detail.trackingLink.remainingMinutes <= 0) {
      throw new GoneException({
        error: 'TrackingLinkExpired',
        message: `Live tracking link expired at ${detail.trackingLink.expiresAt}`,
        metadata: { journeyId },
      });
    }

    return detail;
  }
}
