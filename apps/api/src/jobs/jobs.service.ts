import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addMinutes } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs every 5 minutes to detect tracking links expiring within the next hour.
   * In a production deployment this would send a notification to operations staff.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async trackingLinkMonitor(): Promise<void> {
    const now = new Date();
    const windowEnd = addMinutes(now, 60);
    const expiring = await this.prisma.trackingLink.findMany({
      where: {
        expiresAt: {
          gt: now,
          lte: windowEnd,
        },
      },
      include: {
        journey: {
          include: {
            route: true,
          },
        },
      },
    });

    if (expiring.length) {
      this.logger.warn(
        `Tracking links expiring within 60 minutes: ${expiring
          .map((link) => `${link.journey.route.code} (${link.journeyId})`)
          .join(', ')}`,
      );
    }
  }

  /**
   * Placeholder booking sync job. Replace with integration to upstream ticketing API.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async bookingSync(): Promise<void> {
    this.logger.debug('bookingSync job executed (no-op stub)');
  }
}
