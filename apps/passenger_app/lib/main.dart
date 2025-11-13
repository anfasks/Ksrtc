import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter_platform_interface/google_maps_flutter_platform_interface.dart';
import 'package:google_maps_flutter_web/google_maps_flutter_web.dart';

import 'app/app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(
    fileName: const String.fromEnvironment('ENV_FILE', defaultValue: 'assets/config/.env'),
    fallback: const {
      'API_BASE_URL': 'http://localhost:3333',
    },
  );

  if (kIsWeb) {
    GoogleMapsFlutterPlatform.instance = GoogleMapsFlutterWeb();
  }

  runApp(const ProviderScope(child: PassengerApp()));
}
