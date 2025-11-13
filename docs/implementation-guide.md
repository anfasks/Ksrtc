## Implementation Guide

This guide walks through setting up the project from scratch, covering the Flutter client, NestJS backend, database migrations, and environments.

### 1. Bootstrap the Monorepo

```
repo-root/
  apps/
    passenger_app/      # Flutter
    operations_portal/  # (optional) Flutter web admin
    api/                # NestJS backend
  infra/
    terraform/
  docs/
```

Use `melos` or `nx` for workspace management if you prefer shared tooling across Dart/TypeScript projects.

### 2. Backend Setup (NestJS + Prisma)

```bash
cd apps/api
npm init nest@latest bus-tracking-api
cd bus-tracking-api
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
npm install prisma @prisma/client
npx prisma init
```

Update `prisma/schema.prisma` using the schema snippet outlined in `docs/api-design.md`. Generate the client:

```bash
npx prisma migrate dev --name init
```

#### Core Modules

- `auth` module: OTP verification integration (e.g., Twilio Verify, Firebase).
- `bookings` module: CRUD and lookup endpoints.
- `journeys` module: manages schedule data.
- `tracking-links` module: handles Google Maps URLs.

#### Sample Controller (TypeScript)

```ts
// apps/api/src/tracking/tracking.controller.ts
@Controller('bookings')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':bookingId/tracking')
  @UseGuards(JwtAuthGuard)
  async getTrackingByBooking(
    @Param('bookingId') bookingId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<TrackingLookupResponse> {
    return this.trackingService.lookupByBooking({
      bookingId,
      userId: req.user.id,
    });
  }
}
```

```ts
// apps/api/src/tracking/tracking.service.ts
@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService, private clock: Clock) {}

  async lookupByBooking({ bookingId, userId }: LookupParams) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId },
      include: {
        journey: {
          include: {
            route: { include: { originStop: true, destinationStop: true } },
            trackingLinks: {
              orderBy: { issuedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    const link = booking.journey.trackingLinks[0];
    if (!link) {
      throw new GoneException('Tracking link not available');
    }

    const remaining = Math.max(
      0,
      differenceInMinutes(link.expiresAt, this.clock.now()),
    );

    return {
      journey: JourneySummary.from(booking.journey),
      trackingLink: {
        shareUrl: link.shareUrl,
        expiresAt: link.expiresAt.toISOString(),
        remainingMinutes: remaining,
      },
    };
  }
}
```

#### Google Maps Link Lifecycle

To generate a live tracking link, the driver shares their location via Google Maps on an Android device and shares the link with operations. Automate ingestion through:

1. Mobile app for drivers that posts the generated link.
2. Admin portal input.
3. Email/SMS inbound processing (stretch goal).

Always capture `expires_at` by requesting driver to share for the maximum permissible window.

### 3. Flutter Passenger App

```bash
cd apps/passenger_app
flutter create --org com.ksrtc passenger_app
cd passenger_app
flutter pub add dio riverpod google_maps_flutter url_launcher flutter_secure_storage
```

Recommended folder layout:

```
lib/
  main.dart
  app/
    app.dart
    router.dart
  features/
    auth/
    booking_lookup/
    tracking/
  shared/
    widgets/
    services/
```

#### Environment Configuration

- Use `flutter_dotenv` for API base URLs.
- CI injects environment files per target (`.env.dev`, `.env.prod`).

#### Booking Lookup Flow

```dart
final bookingLookupProvider = FutureProvider.autoDispose.family<
    TrackingLookupResponse, String>((ref, bookingId) async {
  final client = ref.watch(apiClientProvider);
  final response =
      await client.get('/bookings/$bookingId/tracking'); // throws on 404/410
  return TrackingLookupResponse.fromJson(response.data as Map<String, dynamic>);
});
```

```dart
class TrackingScreen extends ConsumerWidget {
  const TrackingScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncValue = ref.watch(bookingLookupProvider(bookingId));

    return Scaffold(
      appBar: AppBar(title: const Text('Live Tracking')),
      body: asyncValue.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(
          message: err is GoneException
              ? 'Tracking link expired. Contact support.'
              : 'Unable to fetch tracking data.',
        ),
        data: (tracking) => GoogleMap(
          initialCameraPosition: CameraPosition(
            target: tracking.journey.origin.latLng,
            zoom: 12,
          ),
          markers: {
            Marker(
              markerId: const MarkerId('bus'),
              position: tracking.journey.currentLocation ?? tracking.journey.origin.latLng,
              infoWindow: InfoWindow(
                title: tracking.journey.routeCode,
                snippet: 'Expires in ${tracking.trackingLink.remainingMinutes} mins',
                onTap: () => launchUrl(Uri.parse(tracking.trackingLink.shareUrl)),
              ),
            ),
          },
        ),
      ),
    );
  }
}
```

For web builds, include `import 'package:google_maps_flutter_web/google_maps_flutter_web.dart';` in `main.dart` to register the web implementation.

#### Handling Deep Links

- Mobile: call `launchUrl(Uri.parse(trackingLink.shareUrl))` to open native Google Maps.
- Web: embed `<iframe src="https://www.google.com/maps/embed?...">` using the same share link for browser users.

### 4. CI/CD Highlights

- Flutter: `flutter test`, `flutter analyze`, build `apk`, `ipa` (via Codemagic or Fastlane), and web assets.
- Backend: `npm run lint`, `npm run test`, Docker build and push to registry, run database migrations with `prisma migrate deploy`.
- Infrastructure: Terraform plan/apply triggered post-approval.

### 5. Environment Strategy

| Environment | Purpose | Notes |
| ----------- | ------- | ----- |
| `dev` | Feature development | Uses staging Firebase project and test Google Maps API key. |
| `staging` | Pre-production validation | Mirrors production data model with limited real data. |
| `prod` | Live traffic | Hardened configuration, monitoring/alerts enabled. |

Secrets managed in Google Secret Manager. Firebase Remote Config can feature flag map enhancements.

### 6. Observability

- NestJS logs shipped to Cloud Logging with correlation IDs.
- Flutter app uses Sentry or Firebase Crashlytics.
- Analytics events: `booking_lookup_success`, `tracking_link_expired`, `tracking_link_refresh_prompt`.

### 7. Acceptance Criteria Checklist

- [ ] Passengers can resolve live tracking by booking ID or PNR.
- [ ] Operations staff can refresh/share new Google Maps URLs quickly.
- [ ] Expired or missing links return actionable feedback.
- [ ] Android, iOS, and web builds share a consistent UI.
- [ ] Deployment pipeline automatically promotes builds with manual approval for production.
