import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ImportBookingsDto } from './dto/import-bookings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('import')
  import(@Body() dto: ImportBookingsDto) {
    return this.bookingsService.import(dto);
  }

  @Get()
  list() {
    return this.bookingsService.findMany();
  }
}
