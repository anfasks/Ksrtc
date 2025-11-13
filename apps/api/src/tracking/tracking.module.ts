import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { JourneysModule } from '../journeys/journeys.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [JourneysModule, BookingsModule],
  providers: [TrackingService],
  controllers: [TrackingController],
})
export class TrackingModule {}
