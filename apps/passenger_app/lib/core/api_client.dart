import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'session/session_controller.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref);
});

class ApiClient {
  ApiClient(this._ref)
      : _dio = Dio(
          BaseOptions(
            baseUrl: dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000',
            connectTimeout: const Duration(seconds: 5),
            receiveTimeout: const Duration(seconds: 15),
            headers: {
              'Content-Type': 'application/json',
            },
          ),
        );

  final Ref _ref;
  final Dio _dio;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.get(
      path,
      queryParameters: queryParameters,
      options: _optionsWithAuth(),
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Object? data,
  }) {
    return _dio.post(
      path,
      queryParameters: queryParameters,
      data: data,
      options: _optionsWithAuth(),
    );
  }

  Options _optionsWithAuth() {
    final session = _ref.read(sessionControllerProvider);
    final headers = <String, Object?>{};
    if (session.accessToken != null) {
      headers['Authorization'] = 'Bearer ${session.accessToken}';
    }
    return Options(headers: headers.isEmpty ? null : headers);
  }
}
