import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/auth_repository.dart';
import '../data/token_storage.dart';
import '../domain/auth_models.dart';
import '../../../shared/providers.dart';

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  final storage = ref.watch(tokenStorageProvider);
  return AuthController(repository, storage);
});

final currentAccessTokenProvider = Provider<String?>((ref) {
  return ref.watch(authControllerProvider).tokens?.accessToken;
});

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._authRepository, this._tokenStorage)
      : super(const AuthState.unauthenticated());

  final AuthRepository _authRepository;
  final TokenStorage _tokenStorage;

  Future<String?> requestOtp({String? phone, String? email}) async {
    state = state.copyWith(
      status: AuthStatus.otpRequested,
      contact: {
        if (phone != null) 'phone': phone,
        if (email != null) 'email': email ?? '',
      },
      error: null,
    );
    try {
      final otp = await _authRepository.requestOtp(phone: phone, email: email);
      return otp;
    } catch (err) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: 'Failed to request OTP: $err',
      );
      rethrow;
    }
  }

  Future<void> verifyOtp({
    String? phone,
    String? email,
    required String otp,
  }) async {
    try {
      final session = await _authRepository.verifyOtp(phone: phone, email: email, otp: otp);
      await _tokenStorage.save(session.tokens);
      state = AuthState(
        status: AuthStatus.authenticated,
        user: session.user,
        tokens: session.tokens,
        contact: {
          if (phone != null) 'phone': phone,
          if (email != null) 'email': email ?? '',
        },
        error: null,
      );
    } catch (err) {
      state = state.copyWith(
        status: AuthStatus.otpRequested,
        error: 'Failed to verify OTP: $err',
      );
      rethrow;
    }
  }

  Future<void> logout() async {
    await _tokenStorage.clear();
    state = const AuthState.unauthenticated();
  }
}
