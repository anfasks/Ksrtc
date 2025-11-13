import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';

class JourneyStop {
  JourneyStop({
    required this.name,
    required this.lat,
    required this.lng,
    required this.scheduledTime,
    this.address,
  });

  final String name;
  final double lat;
  final double lng;
  final DateTime scheduledTime;
  final String? address;

  LatLng get latLng => LatLng(lat, lng);

  factory JourneyStop.fromJson(Map<String, dynamic> json) {
    return JourneyStop(
      name: json['name'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      scheduledTime: DateTime.parse(json['scheduledTime'] as String),
      address: json['address'] as String?,
    );
  }

  String formattedTime() {
    return DateFormat.Hm().format(scheduledTime.toLocal());
  }
}

class JourneySummary {
  JourneySummary({
    required this.id,
    required this.routeCode,
    required this.status,
    required this.serviceDate,
    required this.departureTime,
    required this.arrivalTime,
    required this.origin,
    required this.destination,
  });

  final String id;
  final String routeCode;
  final String status;
  final DateTime serviceDate;
  final DateTime departureTime;
  final DateTime arrivalTime;
  final JourneyStop origin;
  final JourneyStop destination;

  LatLng get originLatLng => origin.latLng;

  factory JourneySummary.fromJson(Map<String, dynamic> json) {
    return JourneySummary(
      id: json['id'] as String,
      routeCode: json['routeCode'] as String,
      status: json['status'] as String,
      serviceDate: DateTime.parse(json['serviceDate'] as String),
      departureTime: DateTime.parse(json['departureTime'] as String),
      arrivalTime: DateTime.parse(json['arrivalTime'] as String),
      origin: JourneyStop.fromJson(json['origin'] as Map<String, dynamic>),
      destination: JourneyStop.fromJson(json['destination'] as Map<String, dynamic>),
    );
  }
}

class TrackingLinkDto {
  TrackingLinkDto({
    required this.shareUrl,
    required this.expiresAt,
    required this.remainingMinutes,
    required this.issuedAt,
  });

  final String shareUrl;
  final DateTime expiresAt;
  final int remainingMinutes;
  final DateTime issuedAt;

  factory TrackingLinkDto.fromJson(Map<String, dynamic> json) {
    return TrackingLinkDto(
      shareUrl: json['shareUrl'] as String,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      remainingMinutes: json['remainingMinutes'] as int,
      issuedAt: DateTime.parse(json['issuedAt'] as String),
    );
  }
}

class TrackingLookupResponse {
  TrackingLookupResponse({
    required this.journey,
    required this.trackingLink,
  });

  final JourneySummary journey;
  final TrackingLinkDto trackingLink;

  factory TrackingLookupResponse.fromJson(Map<String, dynamic> json) {
    return TrackingLookupResponse(
      journey: JourneySummary.fromJson(json['journey'] as Map<String, dynamic>),
      trackingLink: TrackingLinkDto.fromJson(json['trackingLink'] as Map<String, dynamic>),
    );
  }
}
