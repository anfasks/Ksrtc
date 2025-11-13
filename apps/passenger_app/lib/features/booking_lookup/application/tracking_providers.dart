import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/providers.dart';
import '../data/tracking_repository.dart';
import '../domain/tracking_models.dart';

final trackingRepositoryProvider = Provider<TrackingRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return TrackingRepository(dio);
});

final trackingByBookingProvider =
    FutureProvider.autoDispose.family<TrackingLookup, String>((ref, bookingId) async {
  final repository = ref.watch(trackingRepositoryProvider);
  return repository.byBookingId(bookingId);
});

final trackingByPnrProvider = FutureProvider.autoDispose.family<TrackingLookup, String>((ref, pnr) async {
  final repository = ref.watch(trackingRepositoryProvider);
  return repository.byPnr(pnr);
});
