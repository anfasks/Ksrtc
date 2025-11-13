import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JourneysService } from '../journeys/journeys.service';
import { CreateTrackingLinkDto } from './dto/create-tracking-link.dto';
import { JourneyDetailResponse } from '../journeys/dto/journey-response.dto';

@Injectable()
export class TrackingLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journeysService: JourneysService,
  ) {}

  async createForJourney(
    journeyId: string,
    dto: CreateTrackingLinkDto,
  ): Promise<JourneyDetailResponse> {
    const journeyExists = await this.prisma.journey.count({ where: { id: journeyId } });
    if (!journeyExists) {
      throw new NotFoundException(`Journey ${journeyId} not found`);
    }

    await this.prisma.trackingLink.create({
      data: {
        journeyId,
        shareUrl: dto.shareUrl,
        expiresAt: new Date(dto.expiresAt),
        issuedBy: dto.issuedBy,
        notes: dto.notes,
        audits: {
          create: {
            event: 'EXTERNAL_LINK_ATTACHED',
            payload: {
              shareUrl: dto.shareUrl,
              expiresAt: dto.expiresAt,
              issuedBy: dto.issuedBy,
            },
          },
        },
      },
    });

    return this.journeysService.findDetailById(journeyId);
  }
}
