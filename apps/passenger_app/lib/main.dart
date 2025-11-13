import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter_web/google_maps_flutter_web.dart';

import 'app/app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: 'assets/config/.env.dev');

  if (kIsWeb) {
    GoogleMapsFlutterWeb.registerWith();
  }

  runApp(const ProviderScope(child: PassengerApp()));
}
