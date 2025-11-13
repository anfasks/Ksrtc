import { Module } from '@nestjs/common';
import { JourneysModule } from '../journeys/journeys.module';
import { TrackingLinksController } from './tracking-links.controller';
import { TrackingLinksService } from './tracking-links.service';

@Module({
  imports: [JourneysModule],
  controllers: [TrackingLinksController],
  providers: [TrackingLinksService],
  exports: [TrackingLinksService],
})
export class TrackingLinksModule {}
