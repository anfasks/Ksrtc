## Database Schema

The relational schema is normalised to keep routes, journeys, and bookings decoupled from the operational tracking data. All timestamps are stored in UTC.

### Tables

| Table | Key Fields | Description |
| ----- | ---------- | ----------- |
| `users` | `id (uuid)`, `phone`, `email`, `created_at` | Passengers and operations staff with authentication details. |
| `routes` | `id (uuid)`, `code`, `origin_stop_id`, `destination_stop_id` | Logical route definitions (e.g., BLR-MYS). |
| `stops` | `id (uuid)`, `name`, `lat`, `lng`, `address` | Terminal/bus stop metadata. |
| `journeys` | `id (uuid)`, `route_id`, `vehicle_id`, `service_date`, `departure_time`, `arrival_time`, `status` | A single scheduled run of a route. |
| `vehicles` | `id (uuid)`, `registration_no`, `capacity` | Fleet inventory. |
| `bookings` | `id (uuid)`, `booking_id` (unique), `pnr` (unique), `user_id`, `journey_id`, `seat_no`, `status` | Passenger reservations mapped to a journey. |
| `tracking_links` | `id (uuid)`, `journey_id`, `share_url`, `issued_at`, `expires_at`, `issued_by` | Maintains Google live-tracking URL per journey. |
| `tracking_audit` | `id (uuid)`, `tracking_link_id`, `event`, `payload`, `created_at` | Tracks updates/refresh cycles for auditing. |

### Prisma Schema (excerpt)

```prisma
model Journey {
  id             String          @id @default(uuid())
  route          Route           @relation(fields: [routeId], references: [id])
  routeId        String
  vehicle        Vehicle?        @relation(fields: [vehicleId], references: [id])
  vehicleId      String?
  serviceDate    DateTime
  departureTime  DateTime
  arrivalTime    DateTime
  status         JourneyStatus   @default(SCHEDULED)
  bookings       Booking[]
  trackingLinks  TrackingLink[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model TrackingLink {
  id            String    @id @default(uuid())
  journey       Journey   @relation(fields: [journeyId], references: [id])
  journeyId     String
  shareUrl      String
  issuedAt      DateTime  @default(now())
  expiresAt     DateTime
  issuedBy      String
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Booking {
  id         String   @id @default(uuid())
  bookingId  String   @unique
  pnr        String   @unique
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  journey    Journey  @relation(fields: [journeyId], references: [id])
  journeyId  String
  seatNo     String?
  status     BookingStatus @default(CONFIRMED)
  createdAt  DateTime @default(now())
}
```

## API Surface

### Authentication

- `POST /auth/request-otp` → `{ phone/email }`  
  Sends an OTP to the passenger. Rate limited.

- `POST /auth/verify-otp` → `{ phone/email, otp }`  
  Returns `{ accessToken, refreshToken }`.

### Operations Portal

- `POST /journeys`  
  Creates a scheduled journey. Requires service date, departure/arrival, route reference.

- `POST /journeys/{journeyId}/tracking-links`  
  Stores or refreshes a Google Maps live link for the journey. Accepts `shareUrl`, `expiresAt`.

- `PATCH /journeys/{journeyId}`  
  Updates status (`BOARDING`, `ON_ROAD`, `ARRIVED`).

- `POST /bookings/import`  
  Bulk upsert from the ticketing system. Accepts CSV or JSON payload.

### Passenger-Facing

- `GET /bookings/{bookingId}/tracking`  
  Returns the active journey details and live tracking link for an authenticated user.

- `GET /pnr/{pnr}/tracking`  
  Alternative lookup when a PNR is provided.

- `GET /journeys/{journeyId}`  
  Returns metadata (origin, destination, ETA, etc.) for rendering alongside the map.

### Response Example

```json
{
  "journey": {
    "id": "JRN-20250101-001",
    "routeCode": "BLR-MYS",
    "origin": {
      "name": "Kempegowda Bus Station",
      "scheduledDeparture": "2025-01-01T09:00:00Z"
    },
    "destination": {
      "name": "Mysuru KSRTC",
      "scheduledArrival": "2025-01-01T12:30:00Z"
    },
    "status": "ON_ROAD"
  },
  "trackingLink": {
    "shareUrl": "https://maps.app.goo.gl/xyz123",
    "expiresAt": "2025-01-01T18:00:00Z",
    "remainingMinutes": 180
  }
}
```

### Error Handling

- Use standard HTTP codes (`404` booking not found, `410` tracking expired, `401` unauthenticated).
- Error body pattern:

```json
{
  "error": "TrackingLinkExpired",
  "message": "Live tracking link expired at 2025-01-01T12:00:00Z",
  "metadata": {
    "journeyId": "JRN-20250101-001"
  }
}
```

### Background Jobs

- `tracking-link-monitor` (every 5 minutes): finds links expiring within the next 60 minutes, sends notifications to operations staff.
- `booking-sync` (hourly): pulls latest bookings from the ticketing system API.
- `journey-status-updater`: optionally consumes telematics data to update `journey.status`.

## Contracts for Clients

| Endpoint | Request | Response | Notes |
| -------- | ------- | -------- | ----- |
| `/bookings/{bookingId}/tracking` | Headers: `Authorization` | `TrackingLookupResponse` | Primary passenger lookup (booking ID). |
| `/pnr/{pnr}/tracking` | Headers: `Authorization` | `TrackingLookupResponse` | Secondary lookup using PNR. |
| `/journeys/{journeyId}` | Headers: optional | `JourneyDetailResponse` | Frontend fetches additional metadata if needed. |

### TypeScript DTOs (NestJS)

```ts
export class TrackingLookupResponse {
  @ApiProperty()
  journey: JourneySummary;

  @ApiProperty()
  trackingLink: TrackingLinkDto;
}

export class TrackingLinkDto {
  @ApiProperty()
  shareUrl: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty()
  remainingMinutes: number;
}
```

### Flutter Client Contract

```dart
class TrackingLookupResponse {
  TrackingLookupResponse({
    required this.journey,
    required this.trackingLink,
  });

  final JourneySummary journey;
  final TrackingLink trackingLink;

  factory TrackingLookupResponse.fromJson(Map<String, dynamic> json) =>
      TrackingLookupResponse(
        journey: JourneySummary.fromJson(json['journey']),
        trackingLink: TrackingLink.fromJson(json['trackingLink']),
      );
}
```
