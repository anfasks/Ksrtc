-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Enums
CREATE TYPE "JourneyStatus" AS ENUM ('SCHEDULED', 'BOARDING', 'ON_ROAD', 'ARRIVED', 'CANCELLED');
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CHECKED_IN', 'CANCELLED');

-- Create Tables
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "phone" TEXT,
    "email" TEXT UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE "Stop" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE "Route" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL UNIQUE,
    "originStopId" UUID NOT NULL,
    "destinationStopId" UUID NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "Route_originStopId_fkey" FOREIGN KEY ("originStopId") REFERENCES "Stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Route_destinationStopId_fkey" FOREIGN KEY ("destinationStopId") REFERENCES "Stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Vehicle" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "registrationNo" TEXT NOT NULL UNIQUE,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE "Journey" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "routeId" UUID NOT NULL,
    "vehicleId" UUID,
    "serviceDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "departureTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "arrivalTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" "JourneyStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "Journey_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Journey_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Booking" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingId" TEXT NOT NULL UNIQUE,
    "pnr" TEXT NOT NULL UNIQUE,
    "userId" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "seatNo" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TrackingLink" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "journeyId" UUID NOT NULL,
    "shareUrl" TEXT NOT NULL,
    "issuedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "TrackingLink_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TrackingAudit" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "trackingLinkId" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "TrackingAudit_trackingLinkId_fkey" FOREIGN KEY ("trackingLinkId") REFERENCES "TrackingLink"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX "TrackingLink_journeyId_issuedAt_idx" ON "TrackingLink" ("journeyId", "issuedAt");
