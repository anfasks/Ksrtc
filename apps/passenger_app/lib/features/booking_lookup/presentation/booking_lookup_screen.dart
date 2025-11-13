import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/data/auth_repository.dart';
import '../../tracking/data/tracking_repository.dart';
import '../../tracking/models/tracking_lookup_response.dart';
import '../../tracking/presentation/tracking_screen.dart';

class BookingLookupScreen extends ConsumerStatefulWidget {
  const BookingLookupScreen({super.key});

  @override
  ConsumerState<BookingLookupScreen> createState() => _BookingLookupScreenState();
}

class _BookingLookupScreenState extends ConsumerState<BookingLookupScreen> {
  final _bookingController = TextEditingController();
  final _pnrController = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _bookingController.dispose();
    _pnrController.dispose();
    super.dispose();
  }

  Future<void> _lookupBooking({required bool byPnr}) async {
    setState(() {
      _loading = true;
    });
    try {
      final repository = ref.read(trackingRepositoryProvider);
      TrackingLookupResponse response;
      if (byPnr) {
        final pnr = _pnrController.text.trim();
        if (pnr.isEmpty) {
          throw const FormatException('PNR cannot be empty');
        }
        response = await repository.lookupByPnr(pnr);
      } else {
        final bookingId = _bookingController.text.trim();
        if (bookingId.isEmpty) {
          throw const FormatException('Booking ID cannot be empty');
        }
        response = await repository.lookupByBooking(bookingId);
      }

      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => TrackingScreen(
            bookingId: _bookingController.text.trim(),
            response: response,
          ),
        ),
      );
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lookup failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  void _logout() {
    ref.read(authRepositoryProvider).logout();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Your Journey'),
        actions: [
          IconButton(
            tooltip: 'Logout',
            onPressed: _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 500),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Enter your booking reference to fetch the latest live tracking details.',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _bookingController,
                    textInputAction: TextInputAction.search,
                    decoration: const InputDecoration(
                      labelText: 'Booking ID',
                      prefixIcon: Icon(Icons.confirmation_number),
                    ),
                    onSubmitted: (_) => _lookupBooking(byPnr: false),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _loading ? null : () => _lookupBooking(byPnr: false),
                    icon: _loading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.search),
                    label: const Text('Lookup by Booking ID'),
                  ),
                  const SizedBox(height: 32),
                  TextField(
                    controller: _pnrController,
                    decoration: const InputDecoration(
                      labelText: 'PNR (optional alternative)',
                      prefixIcon: Icon(Icons.receipt_long),
                    ),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: _loading ? null : () => _lookupBooking(byPnr: true),
                    child: const Text('Lookup by PNR'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
