# KSRTC Bus Tracking Platform

Full-stack reference implementation for a KSRTC-branded passenger tracking experience.  
The codebase ships an Express + TypeScript backend and a Flutter client that targets Android, iOS, and web from a single codebase.

## Repository Layout

```
apps/
  api/              # Node.js (Express + TypeScript) backend API
  passenger_app/    # Flutter passenger application
docs/               # Architecture and API design documents
```

## Prerequisites

- Node.js 20+
- npm 10+
- Flutter 3.22+ with Android/iOS tooling (or Chrome for Flutter web)
- (Optional) Google Maps API key for mobile builds

## Backend (Express + TypeScript)

```bash
cd apps/api
npm install
npm run start:dev
```

The server boots on `http://localhost:3333` by default and seeds demo data:

- Booking ID: `JRN-20250101-001-001`
- PNR: `PNR12345`
- Passenger email: `rakesh@example.com`

### Key Endpoints

- `POST /auth/request-otp` – request a one-time password (demo returns the OTP in the response)
- `POST /auth/verify-otp` – verify OTP and receive JWT access/refresh tokens
- `POST /journeys` – create a journey (STAFF role)
- `POST /journeys/:journeyId/tracking-links` – attach/refresh live tracking link (STAFF role)
- `POST /bookings/import` – bulk upsert bookings (STAFF role)
- `GET /bookings/:bookingId/tracking` – passenger tracking lookup (requires auth)
- `GET /bookings/pnr/:pnr/tracking` – alternative lookup by PNR

All state is kept in-memory for clarity; plug in Prisma/PostgreSQL for production use.

## Flutter Passenger App

```bash
cd apps/passenger_app
# first-time setup (generates platform directories)
flutter create . --platforms=android,ios,web
flutter pub get
flutter run --dart-define=ENV_FILE=assets/config/.env.sample
```

The sample env file points the client at `http://localhost:3333`.  
Login with the seeded email (`rakesh@example.com`) and use the returned OTP to continue to the booking lookup screen. The app surfaces journey metadata, Google Maps deep link, and renders an inline map preview when running on mobile/web (ensure a Maps API key is configured for native builds).

## Testing & Linting

- Backend: `npm test` (Jest placeholder) and `npm run lint`
- Flutter: `flutter test` and `flutter analyze`

## Further Reading

- `docs/architecture.md` – solution overview and technology choices
- `docs/api-design.md` – database schema and REST contract
- `docs/implementation-guide.md` – step-by-step setup guidance and extended snippets

Contributions welcome! Open an issue or PR with improvements.
