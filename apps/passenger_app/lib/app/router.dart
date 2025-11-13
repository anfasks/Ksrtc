import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/auth_page.dart';
import '../features/booking_lookup/booking_lookup_page.dart';
import '../features/tracking/tracking_screen.dart';
import '../shared/services/auth_controller.dart';

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);
  final authNotifier = ref.read(authControllerProvider.notifier);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: false,
    refreshListenable: GoRouterRefreshStream(authNotifier.stream),
    redirect: (context, state) {
      final status = authState.status;
      final loggingIn = state.matchedLocation == '/';

      if (status == AuthStatus.unknown) {
        return null;
      }

      if (status == AuthStatus.unauthenticated) {
        return loggingIn ? null : '/';
      }

      if (status == AuthStatus.authenticated && loggingIn) {
        return '/lookup';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        name: 'auth',
        builder: (context, state) => const AuthPage(),
      ),
      GoRoute(
        path: '/lookup',
        name: 'lookup',
        builder: (context, state) => const BookingLookupPage(),
      ),
      GoRoute(
        path: '/tracking/:bookingId',
        name: 'tracking',
        builder: (context, state) {
          final bookingId = state.pathParameters['bookingId']!;
          return TrackingScreen(bookingId: bookingId, payload: state.extra);
        },
      ),
    ],
  );
});
