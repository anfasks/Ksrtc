export type UUID = string;

export type JourneyStatus = 'SCHEDULED' | 'BOARDING' | 'ON_ROAD' | 'ARRIVED' | 'CANCELLED';

export interface User {
  id: UUID;
  phone?: string;
  email?: string;
  createdAt: Date;
  role: UserRole;
}

export type UserRole = 'PASSENGER' | 'STAFF';

export interface Route {
  id: UUID;
  code: string;
  originStopId: UUID;
  destinationStopId: UUID;
  createdAt: Date;
}

export interface Stop {
  id: UUID;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface Vehicle {
  id: UUID;
  registrationNo: string;
  capacity: number;
}

export interface Journey {
  id: UUID;
  routeId: UUID;
  vehicleId?: UUID;
  serviceDate: Date;
  departureTime: Date;
  arrivalTime: Date;
  status: JourneyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: UUID;
  bookingId: string;
  pnr: string;
  userId: UUID;
  journeyId: UUID;
  seatNo?: string;
  status: BookingStatus;
  createdAt: Date;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface TrackingLink {
  id: UUID;
  journeyId: UUID;
  shareUrl: string;
  issuedAt: Date;
  expiresAt: Date;
  issuedBy: UUID;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingAudit {
  id: UUID;
  trackingLinkId: UUID;
  event: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface AuthenticatedUser {
  id: UUID;
  role: UserRole;
}

export interface JwtPayload {
  sub: UUID;
  role: UserRole;
  iat: number;
  exp: number;
}
