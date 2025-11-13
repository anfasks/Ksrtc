import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { JourneyStatus } from '@prisma/client';

@Injectable()
export class JourneysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateJourneyDto) {
    await this.ensureRouteExists(dto.routeId);
    if (dto.vehicleId) {
      await this.ensureVehicleExists(dto.vehicleId);
    }

    return this.prisma.journey.create({
      data: {
        routeId: dto.routeId,
        vehicleId: dto.vehicleId,
        serviceDate: dto.serviceDate,
        departureTime: dto.departureTime,
        arrivalTime: dto.arrivalTime,
        status: dto.status ?? JourneyStatus.SCHEDULED,
      },
      include: this.defaultInclude(),
    });
  }

  async update(id: string, dto: UpdateJourneyDto) {
    await this.ensureJourneyExists(id);
    if (dto.vehicleId) {
      await this.ensureVehicleExists(dto.vehicleId);
    }

    return this.prisma.journey.update({
      where: { id },
      data: {
        vehicleId: dto.vehicleId,
        departureTime: dto.departureTime,
        arrivalTime: dto.arrivalTime,
        status: dto.status,
      },
      include: this.defaultInclude(),
    });
  }

  async findById(id: string) {
    const journey = await this.prisma.journey.findUnique({
      where: { id },
      include: this.defaultInclude(),
    });
    if (!journey) {
      throw new NotFoundException(`Journey ${id} not found`);
    }
    return journey;
  }

  private defaultInclude() {
    return {
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
    };
  }

  private async ensureRouteExists(routeId: string) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      throw new NotFoundException(`Route ${routeId} not found`);
    }
  }

  private async ensureVehicleExists(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found`);
    }
  }

  private async ensureJourneyExists(journeyId: string) {
    const journey = await this.prisma.journey.findUnique({ where: { id: journeyId } });
    if (!journey) {
      throw new NotFoundException(`Journey ${journeyId} not found`);
    }
  }
}
