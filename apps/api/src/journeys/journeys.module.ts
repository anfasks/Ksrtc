import { Module } from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { JourneysController } from './journeys.controller';
import { RoutesModule } from '../routes/routes.module';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [RoutesModule, VehiclesModule],
  providers: [JourneysService],
  controllers: [JourneysController],
  exports: [JourneysService],
})
export class JourneysModule {}
