class AuthUser {
  const AuthUser({
    required this.id,
    required this.role,
    this.phone,
    this.email,
  });

  final String id;
  final String role;
  final String? phone;
  final String? email;
}

class AuthTokens {
  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
  });

  final String accessToken;
  final String refreshToken;
  final int expiresIn;
}

class AuthSession {
  const AuthSession({
    required this.user,
    required this.tokens,
  });

  final AuthUser user;
  final AuthTokens tokens;
}

enum AuthStatus {
  unauthenticated,
  otpRequested,
  authenticated,
}

class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.tokens,
    this.contact,
    this.error,
  });

  const AuthState.unauthenticated()
      : status = AuthStatus.unauthenticated,
        user = null,
        tokens = null,
        contact = null,
        error = null;

  final AuthStatus status;
  final AuthUser? user;
  final AuthTokens? tokens;
  final Map<String, String>? contact;
  final String? error;

  AuthState copyWith({
    AuthStatus? status,
    AuthUser? user,
    AuthTokens? tokens,
    Map<String, String>? contact,
    String? error,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      tokens: tokens ?? this.tokens,
      contact: contact ?? this.contact,
      error: error,
    );
  }
}
