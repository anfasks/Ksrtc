import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/services/api_client.dart';
import 'tracking_models.dart';

class TrackingRepository {
  TrackingRepository(this._dio);

  final Dio _dio;

  Future<TrackingLookupResponse> lookupByBooking(String bookingId) async {
    final response = await _dio.get<Map<String, dynamic>>('/bookings/$bookingId/tracking');
    return TrackingLookupResponse.fromJson(response.data!);
  }

  Future<TrackingLookupResponse> lookupByPnr(String pnr) async {
    final response = await _dio.get<Map<String, dynamic>>('/pnr/$pnr/tracking');
    return TrackingLookupResponse.fromJson(response.data!);
  }
}

final trackingRepositoryProvider = Provider<TrackingRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return TrackingRepository(dio);
});
