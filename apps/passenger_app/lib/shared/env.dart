import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  static String get apiBaseUrl =>
      dotenv.maybeGet('API_BASE_URL')?.trim().replaceAll(RegExp(r'/+$'), '') ??
      'http://localhost:3333';
}
