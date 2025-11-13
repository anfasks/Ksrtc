import { Router } from 'express';
import { z } from 'zod';

import { authenticate, requireRole } from '../auth/middleware';
import { dataStore } from '../data/store';
import { differenceInMinutes, nowUtc, toIso } from '../utils/time';

const bookingImportSchema = z.object({
  bookings: z
    .array(
      z.object({
        bookingId: z.string().min(3),
        pnr: z.string().min(3),
        seatNo: z.string().optional(),
        journeyId: z.string(),
        user: z
          .object({
            phone: z.string().min(8).max(20).optional(),
            email: z.string().email().optional(),
          })
          .refine((value) => value.phone || value.email, {
            message: 'User phone or email is required',
            path: ['phone'],
          }),
      }),
    )
    .min(1),
});

export const bookingsRouter = Router();

bookingsRouter.post('/import', authenticate(), requireRole('STAFF'), (req, res) => {
  const parseResult = bookingImportSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'ValidationError', details: parseResult.error.flatten() });
  }
  const created: string[] = [];
  for (const payload of parseResult.data.bookings) {
    const journey = dataStore.findJourneyById(payload.journeyId);
    if (!journey) {
      return res.status(400).json({
        error: 'JourneyNotFound',
        message: `Journey ${payload.journeyId} does not exist`,
      });
    }
    const user = dataStore.upsertUserByContact({
      phone: payload.user.phone,
      email: payload.user.email,
      role: 'PASSENGER',
    });
    const existing = dataStore.findBookingByBookingId(payload.bookingId);
    if (existing) {
      continue;
    }
    dataStore.createBooking({
      bookingId: payload.bookingId,
      pnr: payload.pnr,
      journeyId: payload.journeyId,
      seatNo: payload.seatNo,
      userId: user.id,
    });
    created.push(payload.bookingId);
  }
  return res.status(201).json({ createdCount: created.length, bookingIds: created });
});

bookingsRouter.get('/:bookingId/tracking', authenticate(), (req, res) => {
  const booking = dataStore.findBookingByBookingId(req.params.bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'BookingNotFound', message: 'Booking not found' });
  }
  if (req.user?.role !== 'STAFF' && booking.userId !== req.user?.id) {
    return res
      .status(404)
      .json({ error: 'BookingNotFound', message: 'Booking not found for this passenger' });
  }
  const payload = toTrackingLookup(booking.bookingId);
  if (!payload) {
    return res.status(410).json({
      error: 'TrackingLinkExpired',
      message: 'Live tracking link not available for this booking',
    });
  }
  return res.json(payload);
});

bookingsRouter.get('/pnr/:pnr/tracking', authenticate(), (req, res) => {
  const booking = dataStore.findBookingByPnr(req.params.pnr);
  if (!booking) {
    return res.status(404).json({ error: 'BookingNotFound', message: 'Booking not found' });
  }
  if (req.user?.role !== 'STAFF' && booking.userId !== req.user?.id) {
    return res
      .status(404)
      .json({ error: 'BookingNotFound', message: 'Booking not found for this passenger' });
  }
  const payload = toTrackingLookup(booking.bookingId);
  if (!payload) {
    return res.status(410).json({
      error: 'TrackingLinkExpired',
      message: 'Live tracking link not available for this booking',
    });
  }
  return res.json(payload);
});

function toTrackingLookup(bookingId: string) {
  const booking = dataStore.findBookingByBookingId(bookingId);
  if (!booking) {
    return null;
  }
  const journey = dataStore.getJourneyWithRelations(booking.journeyId);
  if (!journey) {
    return null;
  }
  const latestLink = journey.trackingLinks.at(0);
  if (!latestLink) {
    return null;
  }
  const remainingMinutes = Math.max(0, differenceInMinutes(latestLink.expiresAt, nowUtc()));
  return {
    journey: {
      id: journey.id,
      routeCode: journey.route.code,
      status: journey.status,
      origin: {
        name: journey.originStop.name,
        lat: journey.originStop.lat,
        lng: journey.originStop.lng,
        scheduledDeparture: toIso(journey.departureTime),
      },
      destination: {
        name: journey.destinationStop.name,
        lat: journey.destinationStop.lat,
        lng: journey.destinationStop.lng,
        scheduledArrival: toIso(journey.arrivalTime),
      },
    },
    trackingLink: {
      shareUrl: latestLink.shareUrl,
      expiresAt: toIso(latestLink.expiresAt),
      remainingMinutes,
    },
  };
}
