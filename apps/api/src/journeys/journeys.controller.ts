import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('journeys')
@UseGuards(JwtAuthGuard)
export class JourneysController {
  constructor(private readonly journeysService: JourneysService) {}

  @Post()
  create(@Body() dto: CreateJourneyDto) {
    return this.journeysService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateJourneyDto) {
    return this.journeysService.update(id, dto);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.journeysService.findById(id);
  }
}
