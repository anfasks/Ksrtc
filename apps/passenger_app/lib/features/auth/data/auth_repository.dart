import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/session/session_controller.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref);
});

class AuthRepository {
  AuthRepository(this._ref);

  final Ref _ref;

  ApiClient get _client => _ref.read(apiClientProvider);
  SessionController get _session => _ref.read(sessionControllerProvider.notifier);

  Future<String?> requestOtp({String? phone, String? email}) async {
    final response = await _client.post<Map<String, dynamic>>(
      '/auth/request-otp',
      data: {
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (email != null && email.isNotEmpty) 'email': email,
      },
    );
    return response.data?['debugOtp'] as String?;
  }

  Future<void> verifyOtp({
    String? phone,
    String? email,
    required String otp,
  }) async {
    final response = await _client.post<Map<String, dynamic>>(
      '/auth/verify-otp',
      data: {
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (email != null && email.isNotEmpty) 'email': email,
        'otp': otp,
      },
    );
    final data = response.data ?? {};
    final user = data['user'] as Map<String, dynamic>? ?? {};
    final accessToken = data['accessToken'] as String?;
    final refreshToken = data['refreshToken'] as String?;

    if (accessToken == null) {
      throw StateError('Access token missing in verify response');
    }

    _session.setSession(
      userId: user['id'] as String? ?? 'unknown',
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  void logout() {
    _session.clear();
  }
}
