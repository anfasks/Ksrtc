import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/tracking_lookup_response.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({
    super.key,
    required this.bookingId,
    required this.response,
  });

  final String bookingId;
  final TrackingLookupResponse response;

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  final Completer<GoogleMapController> _mapController = Completer();

  @override
  Widget build(BuildContext context) {
    final journey = widget.response.journey;
    final link = widget.response.trackingLink;
    final origin = LatLng(journey.origin.lat, journey.origin.lng);
    final destination = LatLng(journey.destination.lat, journey.destination.lng);

    final camera = CameraPosition(target: origin, zoom: 10.5);
    final formatter = DateFormat('MMM d, HH:mm');

    return Scaffold(
      appBar: AppBar(
        title: Text('Journey ${journey.routeCode}'),
      ),
      body: Column(
        children: [
          Expanded(
            child: GoogleMap(
              initialCameraPosition: camera,
              markers: {
                Marker(
                  markerId: const MarkerId('origin'),
                  position: origin,
                  infoWindow: InfoWindow(
                    title: journey.origin.name,
                    snippet: 'Departs ${formatter.format(journey.departureTime.toLocal())}',
                  ),
                ),
                Marker(
                  markerId: const MarkerId('destination'),
                  position: destination,
                  infoWindow: InfoWindow(
                    title: journey.destination.name,
                    snippet: 'Arrives ${formatter.format(journey.arrivalTime.toLocal())}',
                  ),
                ),
              },
              onMapCreated: (controller) async {
                if (!_mapController.isCompleted) {
                  _mapController.complete(controller);
                }
                final latMin = origin.latitude < destination.latitude ? origin.latitude : destination.latitude;
                final latMax = origin.latitude > destination.latitude ? origin.latitude : destination.latitude;
                final lngMin = origin.longitude < destination.longitude ? origin.longitude : destination.longitude;
                final lngMax = origin.longitude > destination.longitude ? origin.longitude : destination.longitude;
                final latPadding = (latMax - latMin).abs() < 0.01 ? 0.01 : 0.0;
                final lngPadding = (lngMax - lngMin).abs() < 0.01 ? 0.01 : 0.0;

                await controller.animateCamera(
                  CameraUpdate.newLatLngBounds(
                    LatLngBounds(
                      southwest: LatLng(latMin - latPadding, lngMin - lngPadding),
                      northeast: LatLng(latMax + latPadding, lngMax + lngPadding),
                    ),
                    48,
                  ),
                );
              },
              myLocationEnabled: false,
              compassEnabled: true,
            ),
          ),
          Container(
            width: double.infinity,
            color: Theme.of(context).colorScheme.surfaceVariant,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Booking: ${widget.bookingId}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text('Status: ${journey.status}'),
                if (journey.vehicle != null)
                  Text('Vehicle: ${journey.vehicle!.registrationNo} · ${journey.vehicle!.capacity} seats'),
                Text('Link expires in ${link.remainingMinutes} min'),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => _launchUrl(link.shareUrl),
                  icon: const Icon(Icons.map),
                  label: const Text('Open in Google Maps'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open Google Maps link')),
      );
    }
  }
}
