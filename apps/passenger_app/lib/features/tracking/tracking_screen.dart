import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../booking_lookup/booking_lookup_provider.dart';
import 'data/tracking_models.dart';
import 'data/tracking_repository.dart';

class TrackingScreenPayload {
  TrackingScreenPayload({
    required this.lookupValue,
    required this.mode,
    required this.response,
  });

  final String lookupValue;
  final LookupMode mode;
  final TrackingLookupResponse response;
}

class TrackingScreen extends ConsumerStatefulWidget {
  const TrackingScreen({
    super.key,
    required this.bookingId,
    this.payload,
  });

  final String bookingId;
  final TrackingScreenPayload? payload;

  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  TrackingLookupResponse? _response;
  bool _loading = false;
  String? _error;
  GoogleMapController? _mapController;

  @override
  void initState() {
    super.initState();
    if (widget.payload != null) {
      _response = widget.payload!.response;
    } else {
      unawaited(_loadLatest());
    }
  }

  Future<void> _loadLatest() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repository = ref.read(trackingRepositoryProvider);
      final data = await repository.lookupByBooking(widget.bookingId);
      if (!mounted) return;
      setState(() => _response = data);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Set<Marker> _buildMarkers() {
    final journey = _response!.journey;
    return {
      Marker(
        markerId: const MarkerId('origin'),
        position: journey.origin.latLng,
        infoWindow: InfoWindow(
          title: journey.origin.name,
          snippet: 'Departure ${journey.origin.formattedTime()}',
        ),
      ),
      Marker(
        markerId: const MarkerId('destination'),
        position: journey.destination.latLng,
        infoWindow: InfoWindow(
          title: journey.destination.name,
          snippet: 'Arrival ${journey.destination.formattedTime()}',
        ),
      ),
    };
  }

  Future<void> _openShareUrl() async {
    final url = Uri.parse(_response!.trackingLink.shareUrl);
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to launch Google Maps')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_response == null && _loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Live Tracking')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Unable to load tracking information.',
                  style: theme.textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.error),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _loadLatest,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_response == null) {
      return const Scaffold(
        body: Center(child: Text('No tracking data available.')),
      );
    }

    final journey = _response!.journey;
    final link = _response!.trackingLink;
    final dateFormatter = DateFormat.yMMMMd();
    final timeFormatter = DateFormat.Hm();

    return Scaffold(
      appBar: AppBar(
        title: Text('Route ${journey.routeCode}'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loadLatest,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadLatest,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          children: [
            SizedBox(
              height: 300,
              child: GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: journey.origin.latLng,
                  zoom: 10,
                ),
                markers: _buildMarkers(),
                onMapCreated: (controller) => _mapController = controller,
                polylines: {
                  Polyline(
                    polylineId: const PolylineId('route'),
                    points: [
                      journey.origin.latLng,
                      journey.destination.latLng,
                    ],
                    color: theme.colorScheme.primary,
                    width: 4,
                  ),
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    journey.routeCode,
                    style: theme.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${journey.origin.name} → ${journey.destination.name}',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.calendar_month_outlined, size: 20),
                      const SizedBox(width: 8),
                      Text(dateFormatter.format(journey.serviceDate.toLocal())),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        '${timeFormatter.format(journey.departureTime.toLocal())} - '
                        '${timeFormatter.format(journey.arrivalTime.toLocal())}',
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Live tracking link', style: theme.textTheme.titleMedium),
                          const SizedBox(height: 8),
                          Text(link.shareUrl, style: theme.textTheme.bodySmall),
                          const SizedBox(height: 8),
                          Text(
                            'Valid for ${link.remainingMinutes} minutes',
                            style: theme.textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 12),
                          FilledButton.icon(
                            onPressed: _openShareUrl,
                            icon: const Icon(Icons.map),
                            label: const Text('Open in Google Maps'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }
}
