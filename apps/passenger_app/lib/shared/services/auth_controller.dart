import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AuthStatus { unknown, unauthenticated, authenticated }

class AuthState {
  const AuthState({
    required this.status,
    this.accessToken,
    this.refreshToken,
  });

  final AuthStatus status;
  final String? accessToken;
  final String? refreshToken;

  AuthState copyWith({
    AuthStatus? status,
    String? accessToken,
    String? refreshToken,
  }) {
    return AuthState(
      status: status ?? this.status,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
    );
  }

  static const AuthState unknown = AuthState(status: AuthStatus.unknown);
}

class AuthController extends StateNotifier<AuthState> {
  AuthController() : super(AuthState.unknown);

  void bootstrap() {
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void setTokens({
    required String accessToken,
    required String refreshToken,
  }) {
    state = AuthState(
      status: AuthStatus.authenticated,
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  void signOut() {
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  final notifier = AuthController();
  notifier.bootstrap();
  return notifier;
});
