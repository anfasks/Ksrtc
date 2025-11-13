import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/services/auth_controller.dart';
import 'auth_repository.dart';

class AuthPage extends ConsumerStatefulWidget {
  const AuthPage({super.key});

  @override
  ConsumerState<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends ConsumerState<AuthPage> {
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _otpRequested = false;
  bool _isLoading = false;
  String? _devOtp;

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleRequestOtp() async {
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();

    if (email.isEmpty && phone.isEmpty) {
      _showMessage('Provide either email or phone number.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final repository = ref.read(authRepositoryProvider);
      final otp = await repository.requestOtp(
        email: email.isNotEmpty ? email : null,
        phone: phone.isNotEmpty ? phone : null,
      );
      setState(() {
        _otpRequested = true;
        _devOtp = otp;
      });
      _showMessage('OTP sent successfully.');
    } on DioException catch (error) {
      _showMessage('Failed to request OTP: ${error.message}');
    } catch (error) {
      _showMessage('Failed to request OTP: $error');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleVerifyOtp() async {
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();

    if (otp.isEmpty) {
      _showMessage('Enter the OTP sent to you.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final repository = ref.read(authRepositoryProvider);
      final result = await repository.verifyOtp(
        email: email.isNotEmpty ? email : null,
        phone: phone.isNotEmpty ? phone : null,
        otp: otp,
      );

      ref.read(authControllerProvider.notifier).setTokens(
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          );

      if (mounted) {
        context.go('/lookup');
      }
    } on DioException catch (error) {
      _showMessage('OTP verification failed: ${error.message}');
    } catch (error) {
      _showMessage('OTP verification failed: $error');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text(message)),
      );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 48.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Live Bus Tracking',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  'Enter your email or phone number to receive a one-time password (OTP).',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: 'Phone (E.164)',
                    prefixIcon: Icon(Icons.phone_outlined),
                  ),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: _isLoading ? null : _handleRequestOtp,
                  icon: const Icon(Icons.lock_open),
                  label: const Text('Request OTP'),
                ),
                const SizedBox(height: 12),
                if (_otpRequested) ...[
                  TextField(
                    controller: _otpController,
                    decoration: const InputDecoration(
                      labelText: 'Enter OTP',
                      prefixIcon: Icon(Icons.key_outlined),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _isLoading ? null : _handleVerifyOtp,
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Verify & Continue'),
                  ),
                  if (_devOtp != null && _devOtp!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Development OTP: $_devOtp',
                      textAlign: TextAlign.center,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(fontStyle: FontStyle.italic),
                    ),
                  ],
                ],
                if (_isLoading) ...[
                  const SizedBox(height: 20),
                  const LinearProgressIndicator(),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
