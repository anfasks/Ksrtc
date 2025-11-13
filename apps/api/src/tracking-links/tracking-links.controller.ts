import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JourneyDetailResponse } from '../journeys/dto/journey-response.dto';
import { CreateTrackingLinkDto } from './dto/create-tracking-link.dto';
import { TrackingLinksService } from './tracking-links.service';

@Controller('journeys/:journeyId/tracking-links')
export class TrackingLinksController {
  constructor(private readonly trackingLinksService: TrackingLinksService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('journeyId') journeyId: string,
    @Body() dto: CreateTrackingLinkDto,
  ): Promise<JourneyDetailResponse> {
    return this.trackingLinksService.createForJourney(journeyId, dto);
  }
}
