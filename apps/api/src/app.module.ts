import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JourneysModule } from './journeys/journeys.module';
import { BookingsModule } from './bookings/bookings.module';
import { TrackingModule } from './tracking/tracking.module';
import { RoutesModule } from './routes/routes.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RoutesModule,
    VehiclesModule,
    JourneysModule,
    BookingsModule,
    TrackingModule,
  ],
})
export class AppModule {}
