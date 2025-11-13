import { Injectable, NotFoundException } from '@nestjs/common';
import { JourneyStatus, Prisma } from '@prisma/client';
import { differenceInMinutes } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { JourneyDetailResponse, JourneySummaryDto, TrackingLinkDto } from './dto/journey-response.dto';
import { UpdateJourneyDto } from './dto/update-journey.dto';

@Injectable()
export class JourneysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateJourneyDto): Promise<JourneyDetailResponse> {
    const data: Prisma.JourneyCreateInput = {
      route: { connect: { id: dto.routeId } },
      vehicle: dto.vehicleId ? { connect: { id: dto.vehicleId } } : undefined,
      serviceDate: new Date(dto.serviceDate),
      departureTime: new Date(dto.departureTime),
      arrivalTime: new Date(dto.arrivalTime),
      status: dto.status ?? JourneyStatus.SCHEDULED,
    };

    const journey = await this.prisma.journey.create({
      data,
      include: this.detailInclude,
    });

    return this.toDetailResponse(journey);
  }

  async update(journeyId: string, dto: UpdateJourneyDto): Promise<JourneyDetailResponse> {
    await this.ensureJourneyExists(journeyId);

    const data: Prisma.JourneyUpdateInput = {
      status: dto.status ?? undefined,
      vehicle: dto.vehicleId
        ? { connect: { id: dto.vehicleId } }
        : dto.vehicleId === null
          ? { disconnect: true }
          : undefined,
      departureTime: dto.departureTime ? new Date(dto.departureTime) : undefined,
      arrivalTime: dto.arrivalTime ? new Date(dto.arrivalTime) : undefined,
    };

    const journey = await this.prisma.journey.update({
      where: { id: journeyId },
      data,
      include: this.detailInclude,
    });

    return this.toDetailResponse(journey);
  }

  async findDetailById(journeyId: string): Promise<JourneyDetailResponse> {
    const journey = await this.prisma.journey.findUnique({
      where: { id: journeyId },
      include: this.detailInclude,
    });
    if (!journey) {
      throw new NotFoundException('Journey not found');
    }

    return this.toDetailResponse(journey);
  }

  private async ensureJourneyExists(journeyId: string) {
    const exists = await this.prisma.journey.findUnique({
      where: { id: journeyId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Journey ${journeyId} not found`);
    }
  }

  private toDetailResponse(journey: any): JourneyDetailResponse {
    const origin = journey.route.originStop;
    const destination = journey.route.destinationStop;

    const summary: JourneySummaryDto = {
      id: journey.id,
      routeCode: journey.route.code,
      status: journey.status,
      serviceDate: journey.serviceDate.toISOString(),
      departureTime: journey.departureTime.toISOString(),
      arrivalTime: journey.arrivalTime.toISOString(),
      origin: {
        name: origin.name,
        lat: origin.lat,
        lng: origin.lng,
        scheduledTime: journey.departureTime.toISOString(),
        address: origin.address,
      },
      destination: {
        name: destination.name,
        lat: destination.lat,
        lng: destination.lng,
        scheduledTime: journey.arrivalTime.toISOString(),
        address: destination.address,
      },
    };

    const tracking = journey.trackingLinks?.[0];
    let trackingLink: TrackingLinkDto | null = null;

    if (tracking) {
      const remaining = Math.max(
        0,
        differenceInMinutes(tracking.expiresAt, new Date()),
      );
      trackingLink = {
        shareUrl: tracking.shareUrl,
        expiresAt: tracking.expiresAt.toISOString(),
        issuedAt: tracking.issuedAt.toISOString(),
        remainingMinutes: remaining,
      };
    }

    return {
      journey: summary,
      trackingLink,
    };
  }

  private get detailInclude(): Prisma.JourneyInclude {
    return {
      route: {
        include: {
          originStop: true,
          destinationStop: true,
        },
      },
      trackingLinks: { orderBy: { issuedAt: 'desc' }, take: 1 },
    };
  }
}
