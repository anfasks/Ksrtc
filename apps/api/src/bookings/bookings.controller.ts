import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JourneyDetailResponse } from '../journeys/dto/journey-response.dto';
import { BookingsService } from './bookings.service';
import { ImportBookingsDto } from './dto/import-bookings.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('bookings/import')
  import(@Body() dto: ImportBookingsDto) {
    return this.bookingsService.import(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/:bookingId/tracking')
  lookupByBooking(
    @Param('bookingId') bookingId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<JourneyDetailResponse> {
    return this.bookingsService.lookupByBooking(bookingId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pnr/:pnr/tracking')
  lookupByPnr(
    @Param('pnr') pnr: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<JourneyDetailResponse> {
    return this.bookingsService.lookupByPnr(pnr, req.user.id);
  }
}
