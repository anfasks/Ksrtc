import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { JourneysModule } from '../journeys/journeys.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [JourneysModule, UsersModule],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
