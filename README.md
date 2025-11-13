# KSRTC Bus Tracking Platform

This repository now ships the full working implementation for a KSRTC-branded passenger tracking experience across Android, iOS, and web. The system uses Google Maps live tracking links for each bus journey and resolves them via booking ID or PNR lookup.

## What’s Inside

- `docs/architecture.md` – cross-platform architecture, technology stack, and high-level flows.
- `docs/api-design.md` – database schema, REST contracts, and background job design.
- `docs/implementation-guide.md` – step-by-step setup with sample NestJS and Flutter snippets.
- `apps/api` – NestJS backend with Prisma/PostgreSQL, OTP auth, journey + tracking endpoints, and background jobs.
- `apps/passenger_app` – Flutter client (Android, iOS, Web) that authenticates via OTP and surfaces live tracking.

## Summary

1. Operations staff attach Google Maps live tracking links to each scheduled journey.
2. The backend (NestJS + PostgreSQL) stores routes, bookings, and tracking metadata.
3. Passengers enter their booking ID/PNR in the Flutter app (Android, iOS, web) to retrieve the live bus location or deep link into Google Maps.

The documentation covers authentication, link lifecycle handling, deployment, and observability to fast-track implementation.

## Getting Started

### 1. Backend API (`apps/api`)

```bash
cd apps/api
cp .env.example .env                  # adjust DATABASE_URL if needed
docker compose up -d postgres         # start database (from repo root)
npm install
npx prisma migrate dev                # create schema
npm run seed                          # optional sample data
npm run start:dev
```

Key endpoints (all responses JSON, JWT required unless noted):

- `POST /auth/request-otp` – send OTP to email/phone (dev build returns OTP in response).
- `POST /auth/verify-otp` – exchange OTP for `{ accessToken, refreshToken }`.
- `POST /journeys` – create a journey.
- `POST /journeys/:journeyId/tracking-links` – attach/refresh live tracking link.
- `POST /bookings/import` – bulk import bookings (JSON array or CSV string).
- `GET /bookings/:bookingId/tracking` – passenger lookup by booking ID.
- `GET /pnr/:pnr/tracking` – passenger lookup by PNR.
- `GET /journeys/:journeyId` – journey detail plus latest tracking link.

### 2. Passenger Flutter App (`apps/passenger_app`)

Requirements: Flutter 3.24+, Dart 3.5+, Google Maps API key (configure per platform).

```bash
cd apps/passenger_app
flutter pub get
flutter run -d chrome        # web (uses assets/config/.env.dev)
# or: flutter run -d android / ios (after adding platform-specific Google Maps keys)
```

The app flow:

1. Passenger requests/enters OTP (email or phone).
2. Upon verification the app stores JWT tokens.
3. Booking/Pnr lookup fetches journey + tracking link.
4. Tracking screen renders route markers and opens Google Maps deep link.

### 3. Background Jobs

The NestJS service registers cron jobs using `@nestjs/schedule`:

- `trackingLinkMonitor` (every 5 minutes) – logs upcoming expirations.
- `bookingSync` (hourly stub) – ready for integration with ticketing APIs.

### 4. Testing & Linting

```bash
cd apps/api
npm run lint
npm test

cd ../passenger_app
flutter analyze
flutter test
```

## High-Level Architecture

The solution aligns with the design docs: Flutter client → NestJS API → PostgreSQL via Prisma. Background jobs supervise link expiry, while OTP auth with JWT secures passenger access. The Flutter web build is ready for Firebase Hosting; the backend ships with Docker-friendly configuration for Cloud Run.
