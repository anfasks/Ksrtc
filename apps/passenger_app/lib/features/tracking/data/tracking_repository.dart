import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../models/tracking_lookup_response.dart';

final trackingRepositoryProvider = Provider<TrackingRepository>((ref) {
  return TrackingRepository(ref);
});

class TrackingRepository {
  TrackingRepository(this._ref);

  final Ref _ref;

  ApiClient get _client => _ref.read(apiClientProvider);

  Future<TrackingLookupResponse> lookupByBooking(String bookingId) async {
    final response = await _client.get<Map<String, dynamic>>(
      '/bookings/$bookingId/tracking',
    );
    final data = response.data ?? (throw StateError('Empty response body'));
    return TrackingLookupResponse.fromJson(data);
  }

  Future<TrackingLookupResponse> lookupByPnr(String pnr) async {
    final response = await _client.get<Map<String, dynamic>>(
      '/pnr/$pnr/tracking',
    );
    final data = response.data ?? (throw StateError('Empty response body'));
    return TrackingLookupResponse.fromJson(data);
  }
}
