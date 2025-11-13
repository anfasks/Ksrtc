import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTrackingLinkDto } from './dto/create-tracking-link.dto';
import { Request } from 'express';

@Controller()
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('journeys/:journeyId/tracking-links')
  createTrackingLink(
    @Param('journeyId', ParseUUIDPipe) journeyId: string,
    @Req() req: Request,
    @Body() dto: CreateTrackingLinkDto,
  ) {
    const user = req.user as { id: string };
    return this.trackingService.createTrackingLink(journeyId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/:bookingId/tracking')
  getTrackingByBooking(@Param('bookingId') bookingId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.trackingService.lookupByBooking(bookingId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pnr/:pnr/tracking')
  getTrackingByPnr(@Param('pnr') pnr: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.trackingService.lookupByPnr(pnr, user.id);
  }
}
