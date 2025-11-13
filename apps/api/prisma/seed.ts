import { PrismaClient, JourneyStatus, BookingStatus, TrackingEvent } from '@prisma/client';
import { addHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.info('Seeding database with demo data...');

  await prisma.trackingAudit.deleteMany();
  await prisma.trackingLink.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.journey.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.route.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.user.deleteMany();

  const [origin, destination] = await Promise.all([
    prisma.stop.create({
      data: {
        name: 'Kempegowda Bus Station',
        lat: 12.9778,
        lng: 77.5713,
        address: 'Majestic, Bengaluru, Karnataka',
      },
    }),
    prisma.stop.create({
      data: {
        name: 'Mysuru KSRTC',
        lat: 12.3052,
        lng: 76.6552,
        address: 'Mysuru, Karnataka',
      },
    }),
  ]);

  const route = await prisma.route.create({
    data: {
      code: 'BLR-MYS',
      originStopId: origin.id,
      destinationStopId: destination.id,
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNo: 'KA01AB1234',
      capacity: 42,
    },
  });

  const user = await prisma.user.create({
    data: {
      phone: '+919876543210',
      email: 'passenger@example.com',
    },
  });

  const now = new Date();
  const journey = await prisma.journey.create({
    data: {
      routeId: route.id,
      vehicleId: vehicle.id,
      serviceDate: now,
      departureTime: addHours(now, -1),
      arrivalTime: addHours(now, 2),
      status: JourneyStatus.ON_ROAD,
    },
  });

  const booking = await prisma.booking.create({
    data: {
      bookingId: 'JRN-20250101-001',
      pnr: 'PNR1234567',
      userId: user.id,
      journeyId: journey.id,
      seatNo: '12A',
      status: BookingStatus.CONFIRMED,
    },
    include: { journey: true },
  });

  const link = await prisma.trackingLink.create({
    data: {
      journeyId: booking.journeyId,
      shareUrl: 'https://maps.app.goo.gl/xyz123',
      expiresAt: addHours(now, 6),
      issuedById: user.id,
      audits: {
        create: [
          {
            event: TrackingEvent.CREATED,
            payload: { message: 'Initial link issued by operations' },
          },
        ],
      },
    },
    include: { audits: true },
  });

  console.info(`Seeded journey ${journey.id} with tracking link ${link.shareUrl}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
