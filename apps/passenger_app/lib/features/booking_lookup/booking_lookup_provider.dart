import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../tracking/data/tracking_models.dart';
import '../tracking/data/tracking_repository.dart';

enum LookupMode { bookingId, pnr }

class LookupRequest {
  LookupRequest({required this.value, required this.mode});

  final String value;
  final LookupMode mode;
}

final bookingLookupProvider =
    FutureProvider.autoDispose.family<TrackingLookupResponse, LookupRequest>((ref, request) {
  final repository = ref.watch(trackingRepositoryProvider);
  return request.mode == LookupMode.bookingId
      ? repository.lookupByBooking(request.value)
      : repository.lookupByPnr(request.value);
});
