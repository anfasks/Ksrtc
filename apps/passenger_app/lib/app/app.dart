import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/session/session_controller.dart';
import '../features/auth/presentation/auth_screen.dart';
import '../features/booking_lookup/presentation/booking_lookup_screen.dart';

class PassengerApp extends ConsumerWidget {
  const PassengerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);
    return MaterialApp(
      title: 'Bus Live Tracking',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueAccent),
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
      ),
      home: session.isAuthenticated
          ? const BookingLookupScreen()
          : const AuthScreen(),
    );
  }
}
