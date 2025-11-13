import 'package:dio/dio.dart';

import '../domain/tracking_models.dart';

class TrackingRepository {
  TrackingRepository(this._dio);

  final Dio _dio;

  Future<TrackingLookup> byBookingId(String bookingId) async {
    final response = await _dio.get<Map<String, dynamic>>('/bookings/$bookingId/tracking');
    return TrackingLookup.fromJson(response.data!);
  }

  Future<TrackingLookup> byPnr(String pnr) async {
    final response = await _dio.get<Map<String, dynamic>>('/bookings/pnr/$pnr/tracking');
    return TrackingLookup.fromJson(response.data!);
  }
}
