import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/services/auth_controller.dart';
import '../tracking/data/tracking_models.dart';
import '../tracking/tracking_screen.dart';
import 'booking_lookup_provider.dart';

class BookingLookupPage extends ConsumerStatefulWidget {
  const BookingLookupPage({super.key});

  @override
  ConsumerState<BookingLookupPage> createState() => _BookingLookupPageState();
}

class _BookingLookupPageState extends ConsumerState<BookingLookupPage> {
  final _controller = TextEditingController();
  LookupMode _mode = LookupMode.bookingId;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _performLookup() async {
    final value = _controller.text.trim();
    if (value.isEmpty) {
      setState(() => _errorMessage = 'Booking ID or PNR is required.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final request = LookupRequest(value: value, mode: _mode);
      final response = await ref.read(bookingLookupProvider(request).future);

      if (!mounted) return;
      context.go(
        '/tracking/${response.journey.id}',
        extra: TrackingScreenPayload(
          lookupValue: value,
          mode: _mode,
          response: response,
        ),
      );
    } on DioException catch (error) {
      setState(() => _errorMessage = error.message ?? 'Lookup failed');
    } catch (error) {
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authNotifier = ref.read(authControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Your Journey'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: () {
              authNotifier.signOut();
              context.go('/');
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Enter your booking reference to access live tracking.',
                  style: theme.textTheme.bodyLarge,
                ),
                const SizedBox(height: 16),
                SegmentedButton<LookupMode>(
                  segments: const [
                    ButtonSegment(
                      value: LookupMode.bookingId,
                      label: Text('Booking ID'),
                      icon: Icon(Icons.confirmation_number_outlined),
                    ),
                    ButtonSegment(
                      value: LookupMode.pnr,
                      label: Text('PNR'),
                      icon: Icon(Icons.receipt_long_outlined),
                    ),
                  ],
                  selected: <LookupMode>{_mode},
                  onSelectionChanged: (selection) {
                    setState(() => _mode = selection.first);
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _controller,
                  decoration: InputDecoration(
                    labelText: _mode == LookupMode.bookingId ? 'Booking ID' : 'PNR',
                    prefixIcon: const Icon(Icons.search),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _isLoading ? null : _performLookup,
                  icon: const Icon(Icons.directions_bus),
                  label: const Text('Show Live Tracking'),
                ),
                if (_isLoading) ...[
                  const SizedBox(height: 16),
                  const LinearProgressIndicator(),
                ],
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage!,
                    style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.error),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
