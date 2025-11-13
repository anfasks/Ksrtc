import { PrismaClient, JourneyStatus } from '@prisma/client';
import { addHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  const origin = await prisma.stop.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Kempegowda Bus Station',
      lat: 12.978,
      lng: 77.572,
      address: 'Majestic, Bengaluru, KA',
    },
    update: {},
  });

  const destination = await prisma.stop.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Mysuru KSRTC Bus Stand',
      lat: 12.305,
      lng: 76.655,
      address: 'Mysuru, Karnataka',
    },
    update: {},
  });

  const route = await prisma.route.upsert({
    where: { code: 'BLR-MYS' },
    create: {
      code: 'BLR-MYS',
      originStopId: origin.id,
      destinationStopId: destination.id,
    },
    update: {},
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { registrationNo: 'KA09AB1234' },
    create: {
      registrationNo: 'KA09AB1234',
      capacity: 45,
    },
    update: {},
  });

  const user = await prisma.user.upsert({
    where: { email: 'jane.doe@example.com' },
    create: {
      email: 'jane.doe@example.com',
      phone: '+919876543210',
    },
    update: {},
  });

  const now = new Date();
  const departure = addHours(now, 1);
  const arrival = addHours(departure, 3);

  const journeyId = '33333333-3333-3333-3333-333333333333';
  const journey = await prisma.journey.upsert({
    where: { id: journeyId },
    create: {
      id: journeyId,
      routeId: route.id,
      vehicleId: vehicle.id,
      serviceDate: now,
      departureTime: departure,
      arrivalTime: arrival,
      status: JourneyStatus.ON_ROAD,
    },
    update: {},
  });

  const booking = await prisma.booking.upsert({
    where: { bookingId: 'BKG123456' },
    create: {
      bookingId: 'BKG123456',
      pnr: 'PNR987654',
      userId: user.id,
      journeyId: journey.id,
      seatNo: '12A',
    },
    update: {
      journeyId: journeyId,
    },
  });

  await prisma.trackingLink.create({
    data: {
      journeyId,
      shareUrl: 'https://maps.app.goo.gl/example',
      expiresAt: addHours(now, 6),
      issuedBy: 'system@seed',
      notes: 'Seed tracking link',
      audits: {
        create: [
          {
            event: 'CREATED',
            payload: {
              bookingId: booking.bookingId,
            },
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
