import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/auth_controller.dart';
import '../domain/auth_models.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: 'rakesh@example.com');
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();

  bool _submitting = false;
  String? _demoOtp;

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final isOtpRequested = authState.status == AuthStatus.otpRequested;
    final isAuthenticated = authState.status == AuthStatus.authenticated;

    return Scaffold(
      appBar: AppBar(title: const Text('Passenger Login')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Enter your contact details to request a one-time password',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    hintText: 'you@example.com',
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: 'Phone (optional)',
                    hintText: '+919999999999',
                  ),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _submitting ? null : () => _handleRequestOtp(context),
                  child: _submitting ? const CircularProgressIndicator() : const Text('Request OTP'),
                ),
                if (isOtpRequested || isAuthenticated) ...[
                  const SizedBox(height: 24),
                  TextField(
                    controller: _otpController,
                    decoration: const InputDecoration(labelText: 'OTP'),
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                  ),
                  const SizedBox(height: 12),
                  FilledButton.tonal(
                    onPressed: _submitting ? null : () => _handleVerifyOtp(context),
                    child:
                        _submitting ? const CircularProgressIndicator() : const Text('Verify OTP'),
                  ),
                  if (_demoOtp != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        'Demo OTP: $_demoOtp',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  if (isAuthenticated)
                    Padding(
                      padding: const EdgeInsets.only(top: 24),
                      child: FilledButton.tonal(
                        onPressed: () {
                          if (!mounted) return;
                          Navigator.of(context).pushReplacementNamed('/lookup');
                        },
                        child: const Text('Continue to Tracking'),
                      ),
                    ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleRequestOtp(BuildContext context) async {
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    if (email.isEmpty && phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter email or phone')),
      );
      return;
    }
    setState(() {
      _submitting = true;
      _demoOtp = null;
    });
    try {
      final otp = await ref
          .read(authControllerProvider.notifier)
          .requestOtp(email: email.isEmpty ? null : email, phone: phone.isEmpty ? null : phone);
      setState(() {
        _demoOtp = otp;
      });
      if (_demoOtp != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Demo OTP: $_demoOtp')),
        );
      }
    } catch (err) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to request OTP: $err')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  Future<void> _handleVerifyOtp(BuildContext context) async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter the 6-digit OTP')),
      );
      return;
    }
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    setState(() {
      _submitting = true;
    });
    try {
      await ref.read(authControllerProvider.notifier).verifyOtp(
            email: email.isEmpty ? null : email,
            phone: phone.isEmpty ? null : phone,
            otp: otp,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Logged in successfully')),
      );
      Navigator.of(context).pushReplacementNamed('/lookup');
    } catch (err) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to verify OTP: $err')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }
}
