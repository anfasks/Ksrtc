# KSRTC Bus Tracking Platform

This repository contains the full working code for a KSRTC-branded passenger tracking experience across Android, iOS, and web. The stack combines a NestJS + Prisma backend with a Flutter client for passengers. Operations teams upload Google Maps live tracking links per journey; passengers resolve the link using their booking ID or PNR.

## Monorepo Layout

- `apps/api` – NestJS REST API backed by Prisma/PostgreSQL.
- `apps/passenger_app` – Flutter codebase targeting Android, iOS, and web.
- `docs/` – Architectural notes, API design, and implementation guides.

## Prerequisites

- Node.js 20.x and npm.
- Flutter SDK ≥ 3.24 with compatible Dart SDK.
- Docker (optional) or a PostgreSQL 15/16 instance.

## Backend Setup (`apps/api`)

1. **Start PostgreSQL**  
   ```bash
   docker compose up -d postgres
   ```
   The default connection string is `postgres://postgres:postgres@localhost:5432/bus_tracking`.

2. **Configure environment**  
   ```bash
   cd apps/api
   cp .env.example .env
   ```

3. **Install dependencies & generate Prisma client**  
   ```bash
   npm install
   npm run prisma:migrate    # creates the schema
   npm run prisma:seed       # optional demo data
   ```

4. **Run the API**  
   ```bash
   npm run start:dev
   ```
   The service listens on `http://localhost:3000`. Authentication uses OTP with a debug bypass code (`123456`) supplied via `.env`.

### Sample Flow

```bash
# Request an OTP (returns debug code in non-production)
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'

# Verify the OTP to obtain access/refresh tokens
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"123456"}'
```

Use the returned bearer token when calling protected routes such as `/journeys`, `/bookings/import`, or `/journeys/{id}/tracking-links`.

## Flutter Passenger App (`apps/passenger_app`)

1. **Copy environment file**  
   ```bash
   cd apps/passenger_app
   flutter create . --platforms=android,ios,web --project-name passenger_app --overwrite
   # restore Dart sources from this repository
   git checkout -- lib pubspec.yaml analysis_options.yaml
   cp .env.example .env      # adjust API_BASE_URL if backend is remote
   ```

2. **Fetch dependencies**  
   ```bash
   flutter pub get
   ```

3. **Run on your desired platform**  
   ```bash
   flutter run -d chrome          # web
   flutter run -d android         # Android
   flutter run -d ios             # iOS (requires macOS + Xcode)
   ```

The app authenticates via OTP, prompts for a booking ID or PNR, and displays the journey map with shortcuts to open the Google Maps live link.

## Documentation

- `docs/architecture.md` – cross-platform architecture and technology stack.
- `docs/api-design.md` – database schema, REST contracts, background jobs.
- `docs/implementation-guide.md` – setup walkthrough and best practices.

## Roadmap

- Automate link refresh from telematics devices.
- WebSocket/FCM updates for near-real-time ETA.
- Multi-language support across the Flutter UI.
