import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../domain/auth_models.dart';

class TokenStorage {
  TokenStorage({
    FlutterSecureStorage? secureStorage,
  }) : _secureStorage = secureStorage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
              mOptions: MacOsOptions(accessibility: KeychainAccessibility.first_unlock),
              lOptions: LinuxOptions(),
              webOptions: WebOptions(),
              wOptions: WindowsOptions(),
            );

  final FlutterSecureStorage _secureStorage;
  final Map<String, String> _memoryFallback = {};

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _expiresInKey = 'expires_in';

  Future<void> save(AuthTokens tokens) async {
    try {
      await _secureStorage.write(key: _accessTokenKey, value: tokens.accessToken);
      await _secureStorage.write(key: _refreshTokenKey, value: tokens.refreshToken);
      await _secureStorage.write(key: _expiresInKey, value: tokens.expiresIn.toString());
    } catch (err) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Falling back to in-memory token storage: $err');
      }
      _memoryFallback[_accessTokenKey] = tokens.accessToken;
      _memoryFallback[_refreshTokenKey] = tokens.refreshToken;
      _memoryFallback[_expiresInKey] = tokens.expiresIn.toString();
    }
  }

  Future<AuthTokens?> read() async {
    try {
      final accessToken = await _secureStorage.read(key: _accessTokenKey);
      final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
      final expiresInRaw = await _secureStorage.read(key: _expiresInKey);
      if (accessToken == null || refreshToken == null || expiresInRaw == null) {
        return null;
      }
      return AuthTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresIn: int.tryParse(expiresInRaw) ?? 0,
      );
    } catch (_) {
      final accessToken = _memoryFallback[_accessTokenKey];
      final refreshToken = _memoryFallback[_refreshTokenKey];
      final expiresInRaw = _memoryFallback[_expiresInKey];
      if (accessToken == null || refreshToken == null || expiresInRaw == null) {
        return null;
      }
      return AuthTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresIn: int.tryParse(expiresInRaw) ?? 0,
      );
    }
  }

  Future<void> clear() async {
    try {
      await _secureStorage.delete(key: _accessTokenKey);
      await _secureStorage.delete(key: _refreshTokenKey);
      await _secureStorage.delete(key: _expiresInKey);
    } catch (_) {
      _memoryFallback.clear();
    }
  }
}
