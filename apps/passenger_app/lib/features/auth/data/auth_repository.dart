import 'package:dio/dio.dart';

import '../domain/auth_models.dart';

class AuthRepository {
  AuthRepository(this._dio);

  final Dio _dio;

  Future<String?> requestOtp({
    String? phone,
    String? email,
  }) async {
    final payload = <String, String>{};
    if (phone != null && phone.isNotEmpty) {
      payload['phone'] = phone;
    }
    if (email != null && email.isNotEmpty) {
      payload['email'] = email;
    }
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/request-otp',
      data: payload,
    );
    return response.data?['demoOtp'] as String?;
  }

  Future<AuthSession> verifyOtp({
    String? phone,
    String? email,
    required String otp,
  }) async {
    final payload = <String, Object?>{
      'otp': otp,
    };
    if (phone != null && phone.isNotEmpty) {
      payload['phone'] = phone;
    }
    if (email != null && email.isNotEmpty) {
      payload['email'] = email;
    }
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/verify-otp',
      data: payload,
    );
    final data = response.data!;
    final userJson = data['user'] as Map<String, dynamic>;
    final tokensJson = data['tokens'] as Map<String, dynamic>;
    final session = AuthSession(
      user: AuthUser(
        id: userJson['id'] as String,
        role: userJson['role'] as String,
        phone: userJson['phone'] as String?,
        email: userJson['email'] as String?,
      ),
      tokens: AuthTokens(
        accessToken: tokensJson['accessToken'] as String,
        refreshToken: tokensJson['refreshToken'] as String,
        expiresIn: (tokensJson['expiresIn'] as num).toInt(),
      ),
    );
    return session;
  }

  Future<AuthTokens> refresh(String refreshToken) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    final tokensJson = response.data?['tokens'] as Map<String, dynamic>;
    return AuthTokens(
      accessToken: tokensJson['accessToken'] as String,
      refreshToken: tokensJson['refreshToken'] as String,
      expiresIn: (tokensJson['expiresIn'] as num).toInt(),
    );
  }
}
