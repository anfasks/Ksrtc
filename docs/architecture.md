## Overview

The goal is to deliver a single codebase that ships Android, iOS, and web clients for passengers to view the live location of their booked bus. Each bus exposes a Google Maps live-tracking URL, which is persisted together with the originating and destination terminals. Passengers enter a booking reference (PNR or booking ID) in the app; the system resolves the booking to the active bus journey and surfaces the corresponding live-tracking experience.

The solution is split into three layers:

- **Client applications (Flutter)** for Android, iOS, and the web.
- **Backend services (NestJS)** to manage routes, bookings, and live-tracking links.
- **Database (PostgreSQL)** to store reference data and transactional records.

Optional integrations (for operations teams) include a lightweight back-office portal and background jobs for expiring or refreshing Google tracking links.

## User Journeys

1. **Operations staff** create a bus journey, attach the latest Google Maps sharing link, set route metadata (from, to, scheduled departure/arrival), and map active bookings to the journey.
2. **Passenger** opens the app or website, enters booking/PNR ID, and authenticates with OTP/email.
3. **Client** calls the backend to resolve the booking, receives the bus metadata, and either:
   - launches Google Maps via deep link (mobile), or
   - renders the live session in an embedded map view (web, optionally mobile using an in-app web view).

## Technology Stack

| Layer               | Choice       | Notes |
| ------------------- | ------------ | ----- |
| Cross-platform app  | Flutter      | Single Dart codebase targeting Android/iOS/web. Uses `google_maps_flutter` and `url_launcher`. |
| Backend API         | NestJS (Node.js) | Modular structure, TypeScript, class-validator for DTOs, Swagger for docs. |
| Database            | PostgreSQL   | Managed via Prisma ORM for migrations and type-safe queries. |
| Auth & notifications| Firebase Authentication & Cloud Messaging | OTP, email link login, push notifications for schedule updates. |
| Hosting             | Google Cloud Run (backend), Firebase Hosting (web build) | CI deploy via GitHub Actions. |

## High-Level Architecture

```
Passenger App (Flutter) ─────┐
Web Client (Flutter Web) ────┼──► API Gateway (NestJS + Fastify)
Back-office UI (optional) ───┘
                               │
                               ├──► Booking Service
                               ├──► Journey Service
                               └──► Tracking Link Service
                                         │
                                         └── PostgreSQL (bookings, journeys, tracking_links)
```

Operational tooling publishes/refreshes Google Maps "share my location" links. The backend stores each link with expiry metadata; when a link approaches expiry the job queue notifies operations to refresh.

## Key Components

### Mobile/Web Client

- Flutter project structured with feature-first folders (`/lib/features/{auth,booking,tracking}`).
- State management via Riverpod or Bloc; navigation via `go_router`.
- `google_maps_flutter` (Android/iOS) and `google_maps_flutter_web` for browser support.
- Secure storage for tokens (`flutter_secure_storage` / `SharedPreferences`).
- Internationalisation and theming aligned with brand.

### Backend API

- NestJS modules: `AuthModule`, `BookingsModule`, `JourneysModule`, `TrackingLinksModule`.
- DTO validation ensures booking ID/PNR formats.
- Prisma schema manages Postgres structure; migrations stored in repo.
- Auth tokens (JWT) issued after OTP verification.
- Rate limiting and audit logging on critical endpoints.

### Data Model (conceptual)

- `users`: passenger profile and contact info.
- `bookings`: unique `booking_id`, `pnr_id`, user reference, schedule data.
- `journeys`: bus instance with `route_id`, `vehicle_id`, `starts_at`, `ends_at`.
- `tracking_links`: stores Google Maps live link, `journey_id`, `expires_at`, `created_by`.
- `booking_journeys`: join table mapping bookings to the assigned journey.

### Google Maps Link Handling

Google's consumer live-tracking links expire after the sharing window (max 24 hours). Operations staff must renew the link per journey. Alternatives include integrating with Google Maps Platform Fleet Engine or third-party AVL devices for fully automated tracking.

The backend stores:

```
{
  "journey_id": "JRN-20250101-001",
  "share_url": "https://maps.app.goo.gl/...",
  "expires_at": "2025-01-01T18:00:00Z",
  "valid_for_minutes": 720
}
```

Clients receive both the deep link and metadata to warn passengers when the link is near expiration.

## Security Considerations

- OTP-based login to prevent arbitrary access to tracking links.
- Rate limiting on booking lookup to avoid brute force.
- Signed URLs and short-lived JWTs for API calls.
- Input validation to mitigate injection.
- Logging & monitoring with GCP Cloud Logging.

## Deployment & DevOps

- GitHub Actions pipeline:
  1. Lint/test Flutter app.
  2. Run NestJS unit tests and e2e tests (Jest).
  3. Build Docker image for backend, deploy to Cloud Run.
  4. Deploy Flutter web build to Firebase Hosting.
- Infrastructure as code via Terraform (manages Cloud Run, SQL instance, secrets).

## Future Enhancements

- Replace manual Google Maps links with GPS telematics integration.
- Real-time updates via WebSockets or Firebase Realtime Database for bus ETA/polylines.
- Multi-language support within the Flutter app.
- Offline caching of booking info for low-connectivity corridors.
