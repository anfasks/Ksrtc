import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { differenceInMinutes } from 'date-fns';
import { Prisma, TrackingEvent } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTrackingLinkDto } from './dto/create-tracking-link.dto';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly bookingInclude = Prisma.validator<Prisma.BookingInclude>()({
    journey: {
      include: {
        route: {
          include: {
            originStop: true,
            destinationStop: true,
          },
        },
        vehicle: true,
        trackingLinks: {
          orderBy: { issuedAt: 'desc' },
          take: 1,
        },
      },
    },
    user: true,
  });

  async createTrackingLink(journeyId: string, issuedById: string, dto: CreateTrackingLinkDto) {
    const journey = await this.prisma.journey.findUnique({ where: { id: journeyId } });
    if (!journey) {
      throw new NotFoundException(`Journey ${journeyId} not found`);
    }

    const link = await this.prisma.trackingLink.create({
      data: {
        journeyId,
        shareUrl: dto.shareUrl,
        expiresAt: dto.expiresAt,
        notes: dto.notes,
        issuedById,
        audits: {
          create: [
            {
              event: TrackingEvent.CREATED,
              payload: { source: dto.source ?? 'operations-portal' },
            },
          ],
        },
      },
      include: {
        journey: {
          include: {
            route: {
              include: {
                originStop: true,
                destinationStop: true,
              },
            },
            vehicle: true,
          },
        },
      },
    });

    return link;
  }

  async lookupByBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId },
      include: this.bookingInclude,
    });
    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    return this.buildTrackingResponse(booking);
  }

  async lookupByPnr(pnr: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnr },
      include: this.bookingInclude,
    });
    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    return this.buildTrackingResponse(booking);
  }

  private buildTrackingResponse(
    booking: Prisma.BookingGetPayload<{
      include: typeof this.bookingInclude;
    }>,
  ) {
    if (!booking?.journey) {
      throw new NotFoundException('Journey not linked with booking');
    }

    const link = booking.journey.trackingLinks[0];
    if (!link) {
      throw new GoneException('Tracking link not available');
    }

    if (link.expiresAt.getTime() < Date.now()) {
      throw new GoneException('Tracking link expired');
    }

    const remainingMinutes = Math.max(0, differenceInMinutes(link.expiresAt, new Date()));

    return {
      journey: {
        id: booking.journey.id,
        routeCode: booking.journey.route.code,
        status: booking.journey.status,
        serviceDate: booking.journey.serviceDate.toISOString(),
        departureTime: booking.journey.departureTime.toISOString(),
        arrivalTime: booking.journey.arrivalTime.toISOString(),
        vehicle: booking.journey.vehicle
          ? {
              registrationNo: booking.journey.vehicle.registrationNo,
              capacity: booking.journey.vehicle.capacity,
            }
          : null,
        origin: {
          id: booking.journey.route.originStop.id,
          name: booking.journey.route.originStop.name,
          lat: booking.journey.route.originStop.lat,
          lng: booking.journey.route.originStop.lng,
        },
        destination: {
          id: booking.journey.route.destinationStop.id,
          name: booking.journey.route.destinationStop.name,
          lat: booking.journey.route.destinationStop.lat,
          lng: booking.journey.route.destinationStop.lng,
        },
      },
      trackingLink: {
        id: link.id,
        shareUrl: link.shareUrl,
        expiresAt: link.expiresAt.toISOString(),
        remainingMinutes,
      },
    };
  }
}
