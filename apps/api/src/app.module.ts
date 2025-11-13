import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JourneysModule } from './journeys/journeys.module';
import { TrackingLinksModule } from './tracking-links/tracking-links.module';
import { BookingsModule } from './bookings/bookings.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    JourneysModule,
    TrackingLinksModule,
    BookingsModule,
    HealthModule,
    JobsModule,
  ],
})
export class AppModule {}
