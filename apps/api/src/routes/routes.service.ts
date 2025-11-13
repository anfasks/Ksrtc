import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateStopDto } from './dto/create-stop.dto';
import { CreateRouteDto } from './dto/create-route.dto';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  createStop(dto: CreateStopDto) {
    return this.prisma.stop.create({
      data: {
        name: dto.name,
        lat: dto.lat,
        lng: dto.lng,
        address: dto.address,
      },
    });
  }

  findStops() {
    return this.prisma.stop.findMany();
  }

  async createRoute(dto: CreateRouteDto) {
    const origin = await this.prisma.stop.findUnique({ where: { id: dto.originStopId } });
    const destination = await this.prisma.stop.findUnique({ where: { id: dto.destinationStopId } });
    if (!origin || !destination) {
      throw new NotFoundException('Origin or destination stop not found');
    }

    return this.prisma.route.create({
      data: {
        code: dto.code,
        originStopId: origin.id,
        destinationStopId: destination.id,
      },
      include: {
        originStop: true,
        destinationStop: true,
      },
    });
  }

  listRoutes() {
    return this.prisma.route.findMany({
      include: {
        originStop: true,
        destinationStop: true,
      },
      orderBy: { code: 'asc' },
    });
  }
}
