import 'package:equatable/equatable.dart';

class SessionState extends Equatable {
  const SessionState({
    this.userId,
    this.accessToken,
    this.refreshToken,
  });

  final String? userId;
  final String? accessToken;
  final String? refreshToken;

  bool get isAuthenticated => accessToken != null && userId != null;

  SessionState copyWith({
    String? userId,
    String? accessToken,
    String? refreshToken,
    bool clear = false,
  }) {
    if (clear) {
      return const SessionState();
    }
    return SessionState(
      userId: userId ?? this.userId,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
    );
  }

  @override
  List<Object?> get props => [userId, accessToken, refreshToken];
}
