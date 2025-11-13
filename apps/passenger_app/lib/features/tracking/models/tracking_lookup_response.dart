class TrackingLookupResponse {
  TrackingLookupResponse({
    required this.journey,
    required this.trackingLink,
  });

  final JourneySummary journey;
  final TrackingLink trackingLink;

  factory TrackingLookupResponse.fromJson(Map<String, dynamic> json) {
    return TrackingLookupResponse(
      journey: JourneySummary.fromJson(json['journey'] as Map<String, dynamic>),
      trackingLink: TrackingLink.fromJson(json['trackingLink'] as Map<String, dynamic>),
    );
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
    this.vehicle,
  });

  final String id;
  final String routeCode;
  final String status;
  final DateTime serviceDate;
  final DateTime departureTime;
  final DateTime arrivalTime;
  final StopSummary origin;
  final StopSummary destination;
  final VehicleSummary? vehicle;

  factory JourneySummary.fromJson(Map<String, dynamic> json) {
    return JourneySummary(
      id: json['id'] as String,
      routeCode: json['routeCode'] as String,
      status: json['status'] as String,
      serviceDate: DateTime.parse(json['serviceDate'] as String),
      departureTime: DateTime.parse(json['departureTime'] as String),
      arrivalTime: DateTime.parse(json['arrivalTime'] as String),
      origin: StopSummary.fromJson(json['origin'] as Map<String, dynamic>),
      destination: StopSummary.fromJson(json['destination'] as Map<String, dynamic>),
      vehicle: json['vehicle'] != null
          ? VehicleSummary.fromJson(json['vehicle'] as Map<String, dynamic>)
          : null,
    );
  }
}

class StopSummary {
  StopSummary({
    required this.id,
    required this.name,
    required this.lat,
    required this.lng,
  });

  final String id;
  final String name;
  final double lat;
  final double lng;

  factory StopSummary.fromJson(Map<String, dynamic> json) {
    return StopSummary(
      id: json['id'] as String,
      name: json['name'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
    );
  }
}

class VehicleSummary {
  VehicleSummary({
    required this.registrationNo,
    required this.capacity,
  });

  final String registrationNo;
  final int capacity;

  factory VehicleSummary.fromJson(Map<String, dynamic> json) {
    return VehicleSummary(
      registrationNo: json['registrationNo'] as String,
      capacity: (json['capacity'] as num).toInt(),
    );
  }
}

class TrackingLink {
  TrackingLink({
    required this.id,
    required this.shareUrl,
    required this.expiresAt,
    required this.remainingMinutes,
  });

  final String id;
  final String shareUrl;
  final DateTime expiresAt;
  final int remainingMinutes;

  factory TrackingLink.fromJson(Map<String, dynamic> json) {
    return TrackingLink(
      id: json['id'] as String,
      shareUrl: json['shareUrl'] as String,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      remainingMinutes: (json['remainingMinutes'] as num).toInt(),
    );
  }
}
