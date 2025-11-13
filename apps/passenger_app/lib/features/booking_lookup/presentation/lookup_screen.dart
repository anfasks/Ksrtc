import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../auth/application/auth_controller.dart';
import '../application/tracking_providers.dart';
import '../domain/tracking_models.dart';

class BookingLookupScreen extends ConsumerStatefulWidget {
  const BookingLookupScreen({super.key});

  @override
  ConsumerState<BookingLookupScreen> createState() => _BookingLookupScreenState();
}

class _BookingLookupScreenState extends ConsumerState<BookingLookupScreen> {
  final _bookingController = TextEditingController(text: 'JRN-20250101-001-001');
  final _pnrController = TextEditingController(text: 'PNR12345');

  bool _loading = false;
  String? _error;
  TrackingLookup? _result;
  bool _lookupByPnr = false;

  @override
  void dispose() {
    _bookingController.dispose();
    _pnrController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.user;

    if (authState.status != AuthStatus.authenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        Navigator.of(context).pushReplacementNamed('/');
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Tracking'),
        actions: [
          if (user != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Center(
                child: Text(
                  'Hi, ${user.email ?? user.phone ?? 'Passenger'}',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
              ),
            ),
          IconButton(
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (!mounted) return;
              Navigator.of(context).pushReplacementNamed('/');
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: ListView(
          children: [
            ToggleButtons(
              isSelected: [_lookupByPnr == false, _lookupByPnr == true],
              onPressed: (index) {
                setState(() {
                  _lookupByPnr = index == 1;
                });
              },
              children: const [
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text('Booking ID'),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text('PNR'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _lookupByPnr ? _pnrController : _bookingController,
              decoration: InputDecoration(
                labelText: _lookupByPnr ? 'Enter PNR' : 'Enter Booking ID',
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : () => _handleLookup(context),
              child: _loading ? const CircularProgressIndicator() : const Text('Fetch Live Status'),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            if (_result != null) ...[
              const SizedBox(height: 24),
              TrackingResultCard(result: _result!),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _handleLookup(BuildContext context) async {
    final repository = ref.read(trackingRepositoryProvider);
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final value = _lookupByPnr
          ? await repository.byPnr(_pnrController.text.trim())
          : await repository.byBookingId(_bookingController.text.trim());
      setState(() {
        _result = value;
      });
    } catch (err) {
      setState(() {
        _error = 'Unable to fetch tracking: $err';
        _result = null;
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }
}

class TrackingResultCard extends StatelessWidget {
  const TrackingResultCard({super.key, required this.result});

  final TrackingLookup result;

  @override
  Widget build(BuildContext context) {
    final origin = result.journey.origin;
    final destination = result.journey.destination;
    final originLatLng = _toLatLng(origin);
    final destinationLatLng = _toLatLng(destination);

    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  result.journey.routeCode,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Chip(
                  label: Text(result.journey.status),
                  avatar: const Icon(Icons.directions_bus),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _JourneyPointTile(
              title: 'Origin',
              name: origin.name,
              scheduled: origin.scheduledAt,
            ),
            const SizedBox(height: 12),
            _JourneyPointTile(
              title: 'Destination',
              name: destination.name,
              scheduled: destination.scheduledAt,
            ),
            const SizedBox(height: 16),
            Text(
              'Tracking Link expires in ${result.trackingLink.remainingMinutes} minutes',
            ),
            const SizedBox(height: 12),
            FilledButton.tonalIcon(
              onPressed: () => launchUrl(Uri.parse(result.trackingLink.shareUrl)),
              icon: const Icon(Icons.map),
              label: const Text('Open Live Map'),
            ),
            if (originLatLng != null && destinationLatLng != null) ...[
              const SizedBox(height: 16),
              SizedBox(
                height: 250,
                child: GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: originLatLng,
                    zoom: 8,
                  ),
                  markers: {
                    Marker(
                      markerId: const MarkerId('origin'),
                      position: originLatLng,
                      infoWindow: InfoWindow(
                        title: origin.name,
                        snippet: 'Departs ${origin.scheduledAt}',
                      ),
                    ),
                    Marker(
                      markerId: const MarkerId('destination'),
                      position: destinationLatLng,
                      infoWindow: InfoWindow(
                        title: destination.name,
                        snippet: 'Arrives ${destination.scheduledAt}',
                      ),
                    ),
                  },
                  polylines: {
                    Polyline(
                      polylineId: const PolylineId('route'),
                      points: [originLatLng, destinationLatLng],
                    ),
                  },
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: false,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  LatLng? _toLatLng(JourneyPoint point) {
    if (point.lat == null || point.lng == null) {
      return null;
    }
    return LatLng(point.lat!, point.lng!);
  }
}

class _JourneyPointTile extends StatelessWidget {
  const _JourneyPointTile({
    required this.title,
    required this.name,
    required this.scheduled,
  });

  final String title;
  final String name;
  final String scheduled;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(title == 'Origin' ? Icons.place : Icons.flag),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.labelLarge),
              Text(name),
              Text(
                scheduled,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
