import { addHours } from '../utils/time';
import { dataStore } from './store';

export interface SeedConfig {
  staffContact?: {
    email?: string;
    phone?: string;
  };
  passengerContact?: {
    email?: string;
    phone?: string;
  };
}

export interface SeedResult {
  journeyId: string;
  bookingId: string;
  pnr: string;
}

export function seedDemoData(config: SeedConfig = {}): SeedResult {
  const staff = dataStore.upsertUserByContact({
    email: config.staffContact?.email ?? 'ops@example.com',
    phone: config.staffContact?.phone,
    role: 'STAFF',
  });

  const passenger = dataStore.upsertUserByContact({
    email: config.passengerContact?.email ?? 'rakesh@example.com',
    phone: config.passengerContact?.phone ?? '+919999999999',
    role: 'PASSENGER',
  });

  const originStop = dataStore.createStop({
    id: 'stop-blr-terminal',
    name: 'Kempegowda Bus Station',
    lat: 12.9784,
    lng: 77.5720,
    address: 'Majestic, Bengaluru, India',
  });

  const destinationStop = dataStore.createStop({
    id: 'stop-mys-terminal',
    name: 'Mysuru KSRTC Bus Stand',
    lat: 12.3073,
    lng: 76.6497,
    address: 'Mysuru, Karnataka, India',
  });

  const route = dataStore.createRoute({
    id: 'route-blr-mys',
    code: 'BLR-MYS',
    originStopId: originStop.id,
    destinationStopId: destinationStop.id,
  });

  const vehicle = dataStore.createVehicle({
    id: 'vehicle-ka09-1234',
    registrationNo: 'KA09-1234',
    capacity: 45,
  });

  const departure = new Date(Date.UTC(2025, 0, 1, 3, 30)); // 2025-01-01T03:30:00Z
  const arrival = addHours(departure, 3.5);

  const journey = dataStore.createJourney({
    routeId: route.id,
    vehicleId: vehicle.id,
    serviceDate: departure,
    departureTime: departure,
    arrivalTime: arrival,
    status: 'ON_ROAD',
  });

  dataStore.createTrackingLink({
    journeyId: journey.id,
    shareUrl: 'https://maps.app.goo.gl/example-live-link',
    expiresAt: addHours(new Date(), 6),
    issuedBy: staff.id,
    notes: 'Auto-seeded link valid for 6 hours.',
  });

  const bookingId = 'JRN-20250101-001-001';
  const pnr = 'PNR12345';

  dataStore.createBooking({
    bookingId,
    pnr,
    userId: passenger.id,
    journeyId: journey.id,
    seatNo: '12A',
  });

  return {
    journeyId: journey.id,
    bookingId,
    pnr,
  };
}
