class TrackingLookup {
  TrackingLookup({
    required this.journey,
    required this.trackingLink,
  });

  final JourneySummary journey;
  final TrackingLink trackingLink;

  factory TrackingLookup.fromJson(Map<String, dynamic> json) {
    return TrackingLookup(
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
    required this.origin,
    required this.destination,
  });

  final String id;
  final String routeCode;
  final String status;
  final JourneyPoint origin;
  final JourneyPoint destination;

  factory JourneySummary.fromJson(Map<String, dynamic> json) {
    return JourneySummary(
      id: json['id'] as String,
      routeCode: json['routeCode'] as String,
      status: json['status'] as String,
      origin: JourneyPoint.fromJson(json['origin'] as Map<String, dynamic>),
      destination: JourneyPoint.fromJson(json['destination'] as Map<String, dynamic>),
    );
  }
}

class JourneyPoint {
  JourneyPoint({
    required this.name,
    required this.scheduledAt,
    this.lat,
    this.lng,
  });

  final String name;
  final String scheduledAt;
  final double? lat;
  final double? lng;

  factory JourneyPoint.fromJson(Map<String, dynamic> json) {
    return JourneyPoint(
      name: json['name'] as String,
      scheduledAt: json['scheduledDeparture'] as String? ?? json['scheduledArrival'] as String? ?? '',
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
    );
  }
}

class TrackingLink {
  TrackingLink({
    required this.shareUrl,
    required this.expiresAt,
    required this.remainingMinutes,
  });

  final String shareUrl;
  final String expiresAt;
  final int remainingMinutes;

  factory TrackingLink.fromJson(Map<String, dynamic> json) {
    return TrackingLink(
      shareUrl: json['shareUrl'] as String,
      expiresAt: json['expiresAt'] as String,
      remainingMinutes: (json['remainingMinutes'] as num).toInt(),
    );
  }
}
