import { randomUUID } from 'crypto';

import {
  Booking,
  Journey,
  JourneyStatus,
  Route,
  Stop,
  TrackingLink,
  User,
  UserRole,
  Vehicle,
} from '../types';

interface CreateUserInput {
  phone?: string;
  email?: string;
  role: UserRole;
}

interface CreateJourneyInput {
  routeId: string;
  vehicleId?: string;
  serviceDate: Date;
  departureTime: Date;
  arrivalTime: Date;
  status?: JourneyStatus;
}

interface UpdateJourneyInput {
  status?: JourneyStatus;
  departureTime?: Date;
  arrivalTime?: Date;
  vehicleId?: string;
}

interface CreateTrackingLinkInput {
  journeyId: string;
  shareUrl: string;
  expiresAt: Date;
  issuedBy: string;
  notes?: string;
}

interface CreateBookingInput {
  bookingId: string;
  pnr: string;
  userId: string;
  journeyId: string;
  seatNo?: string;
}

export interface JourneyWithRelations extends Journey {
  route: Route;
  originStop: Stop;
  destinationStop: Stop;
  vehicle?: Vehicle;
  trackingLinks: TrackingLink[];
}

export class DataStore {
  private users = new Map<string, User>();
  private routes = new Map<string, Route>();
  private stops = new Map<string, Stop>();
  private vehicles = new Map<string, Vehicle>();
  private journeys = new Map<string, Journey>();
  private bookings = new Map<string, Booking>();
  private trackingLinksByJourney = new Map<string, TrackingLink[]>();
  private bookingsByBookingId = new Map<string, string>();
  private bookingsByPnr = new Map<string, string>();

  createUser(input: CreateUserInput): User {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      id,
      phone: input.phone,
      email: input.email,
      createdAt: now,
      role: input.role,
    };
    this.users.set(id, user);
    return user;
  }

  upsertUserByContact(input: CreateUserInput): User {
    const existing = this.findUserByContact(input.phone, input.email);
    if (existing) {
      if (input.role !== existing.role) {
        existing.role = input.role;
      }
      return existing;
    }
    return this.createUser(input);
  }

  findUserByContact(phone?: string, email?: string): User | undefined {
    for (const user of this.users.values()) {
      if (phone && user.phone === phone) {
        return user;
      }
      if (email && user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  createRoute(route: Omit<Route, 'createdAt'> & { createdAt?: Date }): Route {
    const finalRoute: Route = {
      ...route,
      createdAt: route.createdAt ?? new Date(),
    };
    this.routes.set(finalRoute.id, finalRoute);
    return finalRoute;
  }

  createStop(stop: Stop): Stop {
    this.stops.set(stop.id, stop);
    return stop;
  }

  createVehicle(vehicle: Vehicle): Vehicle {
    this.vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  createJourney(input: CreateJourneyInput): Journey {
    const now = new Date();
    const journey: Journey = {
      id: randomUUID(),
      routeId: input.routeId,
      vehicleId: input.vehicleId,
      serviceDate: input.serviceDate,
      departureTime: input.departureTime,
      arrivalTime: input.arrivalTime,
      status: input.status ?? 'SCHEDULED',
      createdAt: now,
      updatedAt: now,
    };
    this.journeys.set(journey.id, journey);
    return journey;
  }

  updateJourney(id: string, updates: UpdateJourneyInput): Journey | undefined {
    const journey = this.journeys.get(id);
    if (!journey) {
      return undefined;
    }
    if (updates.status) {
      journey.status = updates.status;
    }
    if (updates.departureTime) {
      journey.departureTime = updates.departureTime;
    }
    if (updates.arrivalTime) {
      journey.arrivalTime = updates.arrivalTime;
    }
    if (updates.vehicleId !== undefined) {
      journey.vehicleId = updates.vehicleId;
    }
    journey.updatedAt = new Date();
    this.journeys.set(id, journey);
    return journey;
  }

  findJourneyById(id: string): Journey | undefined {
    return this.journeys.get(id);
  }

  getJourneyWithRelations(id: string): JourneyWithRelations | undefined {
    const journey = this.journeys.get(id);
    if (!journey) {
      return undefined;
    }
    const route = this.routes.get(journey.routeId);
    if (!route) {
      throw new Error(`Route ${journey.routeId} missing for journey ${id}`);
    }
    const originStop = this.stops.get(route.originStopId);
    const destinationStop = this.stops.get(route.destinationStopId);
    if (!originStop || !destinationStop) {
      throw new Error(`Stops missing for route ${route.id}`);
    }
    const vehicle = journey.vehicleId ? this.vehicles.get(journey.vehicleId) : undefined;
    const trackingLinks = this.trackingLinksByJourney.get(id) ?? [];
    return {
      ...journey,
      route,
      originStop,
      destinationStop,
      vehicle,
      trackingLinks,
    };
  }

  createTrackingLink(input: CreateTrackingLinkInput): TrackingLink {
    const link: TrackingLink = {
      id: randomUUID(),
      journeyId: input.journeyId,
      shareUrl: input.shareUrl,
      issuedAt: new Date(),
      expiresAt: input.expiresAt,
      issuedBy: input.issuedBy,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const existing = this.trackingLinksByJourney.get(input.journeyId) ?? [];
    existing.unshift(link);
    this.trackingLinksByJourney.set(input.journeyId, existing);
    return link;
  }

  getLatestTrackingLinkForJourney(journeyId: string): TrackingLink | undefined {
    const links = this.trackingLinksByJourney.get(journeyId);
    if (!links || links.length === 0) {
      return undefined;
    }
    return links[0];
  }

  createBooking(input: CreateBookingInput): Booking {
    const booking: Booking = {
      id: randomUUID(),
      bookingId: input.bookingId,
      pnr: input.pnr,
      userId: input.userId,
      journeyId: input.journeyId,
      seatNo: input.seatNo,
      status: 'CONFIRMED',
      createdAt: new Date(),
    };
    this.bookings.set(booking.id, booking);
    this.bookingsByBookingId.set(booking.bookingId, booking.id);
    this.bookingsByPnr.set(booking.pnr, booking.id);
    return booking;
  }

  findBookingByBookingId(bookingId: string): Booking | undefined {
    const id = this.bookingsByBookingId.get(bookingId);
    return id ? this.bookings.get(id) : undefined;
  }

  findBookingByPnr(pnr: string): Booking | undefined {
    const id = this.bookingsByPnr.get(pnr);
    return id ? this.bookings.get(id) : undefined;
  }

  listBookingsForJourney(journeyId: string): Booking[] {
    return Array.from(this.bookings.values()).filter((booking) => booking.journeyId === journeyId);
  }

  listJourneys(): Journey[] {
    return Array.from(this.journeys.values());
  }

  listRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  listStops(): Stop[] {
    return Array.from(this.stops.values());
  }
}

export const dataStore = new DataStore();
