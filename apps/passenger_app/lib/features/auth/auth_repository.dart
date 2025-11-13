import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/services/api_client.dart';

class AuthRepository {
  AuthRepository(this._dio);

  final Dio _dio;

  Future<String> requestOtp({String? email, String? phone}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/request-otp',
      data: {
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
      },
    );
    return response.data?['devOtp']?.toString() ?? '';
  }

  Future<({String accessToken, String refreshToken})> verifyOtp({
    String? email,
    String? phone,
    required String otp,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/verify-otp',
      data: {
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        'otp': otp,
      },
    );

    final data = response.data ?? {};
    return (
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return AuthRepository(dio);
});
