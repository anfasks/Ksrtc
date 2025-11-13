import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'session_state.dart';

final sessionControllerProvider =
    StateNotifierProvider<SessionController, SessionState>((ref) {
  return SessionController();
});

class SessionController extends StateNotifier<SessionState> {
  SessionController() : super(const SessionState());

  void setSession({
    required String userId,
    required String accessToken,
    String? refreshToken,
  }) {
    state = state.copyWith(
      userId: userId,
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  void clear() {
    state = state.copyWith(clear: true);
  }
}
