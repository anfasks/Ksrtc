import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { JourneyDetailResponse } from './dto/journey-response.dto';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { JourneysService } from './journeys.service';

@Controller('journeys')
export class JourneysController {
  constructor(private readonly journeysService: JourneysService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateJourneyDto): Promise<JourneyDetailResponse> {
    return this.journeysService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':journeyId')
  update(
    @Param('journeyId') journeyId: string,
    @Body() dto: UpdateJourneyDto,
  ): Promise<JourneyDetailResponse> {
    return this.journeysService.update(journeyId, dto);
  }

  @Get(':journeyId')
  findOne(@Param('journeyId') journeyId: string): Promise<JourneyDetailResponse> {
    return this.journeysService.findDetailById(journeyId);
  }
}
