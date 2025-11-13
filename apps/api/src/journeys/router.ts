import { Router } from 'express';
import { z } from 'zod';

import { authenticate, requireRole } from '../auth/middleware';
import { dataStore } from '../data/store';
import { differenceInMinutes, nowUtc, toIso } from '../utils/time';

const createJourneySchema = z.object({
  routeId: z.string(),
  vehicleId: z.string().optional(),
  serviceDate: z.string().datetime(),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  status: z.enum(['SCHEDULED', 'BOARDING', 'ON_ROAD', 'ARRIVED', 'CANCELLED']).optional(),
});

const updateJourneySchema = z
  .object({
    status: z.enum(['SCHEDULED', 'BOARDING', 'ON_ROAD', 'ARRIVED', 'CANCELLED']).optional(),
    departureTime: z.string().datetime().optional(),
    arrivalTime: z.string().datetime().optional(),
    vehicleId: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

const createTrackingLinkSchema = z.object({
  shareUrl: z.string().url(),
  expiresAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const journeysRouter = Router();

journeysRouter.post('/', authenticate(), requireRole('STAFF'), (req, res) => {
  const parseResult = createJourneySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'ValidationError', details: parseResult.error.flatten() });
  }
  const route = dataStore.listRoutes().find((r) => r.id === parseResult.data.routeId);
  if (!route) {
    return res.status(404).json({ error: 'RouteNotFound', message: 'Route does not exist' });
  }
  const journey = dataStore.createJourney({
    routeId: parseResult.data.routeId,
    vehicleId: parseResult.data.vehicleId,
    serviceDate: new Date(parseResult.data.serviceDate),
    departureTime: new Date(parseResult.data.departureTime),
    arrivalTime: new Date(parseResult.data.arrivalTime),
    status: parseResult.data.status,
  });
  return res.status(201).json(toJourneyDetail(journey.id));
});

journeysRouter.patch('/:journeyId', authenticate(), requireRole('STAFF'), (req, res) => {
  const parseResult = updateJourneySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'ValidationError', details: parseResult.error.flatten() });
  }
  const journey = dataStore.updateJourney(req.params.journeyId, {
    status: parseResult.data.status,
    departureTime: parseResult.data.departureTime ? new Date(parseResult.data.departureTime) : undefined,
    arrivalTime: parseResult.data.arrivalTime ? new Date(parseResult.data.arrivalTime) : undefined,
    vehicleId: parseResult.data.vehicleId,
  });
  if (!journey) {
    return res.status(404).json({ error: 'JourneyNotFound', message: 'Journey not found' });
  }
  return res.json(toJourneyDetail(journey.id));
});

journeysRouter.post(
  '/:journeyId/tracking-links',
  authenticate(),
  requireRole('STAFF'),
  (req, res) => {
    const parseResult = createTrackingLinkSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'ValidationError', details: parseResult.error.flatten() });
    }
    const journey = dataStore.findJourneyById(req.params.journeyId);
    if (!journey) {
      return res.status(404).json({ error: 'JourneyNotFound', message: 'Journey not found' });
    }
    const userId = req.user?.id ?? 'system';
    dataStore.createTrackingLink({
      journeyId: journey.id,
      shareUrl: parseResult.data.shareUrl,
      expiresAt: new Date(parseResult.data.expiresAt),
      issuedBy: userId,
      notes: parseResult.data.notes,
    });
    return res.status(201).json(toJourneyDetail(journey.id));
  },
);

journeysRouter.get('/:journeyId', authenticate(false), (req, res) => {
  const summary = toJourneyDetail(req.params.journeyId);
  if (!summary) {
    return res.status(404).json({ error: 'JourneyNotFound', message: 'Journey not found' });
  }
  return res.json(summary);
});

journeysRouter.get('/', authenticate(), requireRole('STAFF'), (_req, res) => {
  const journeys = dataStore.listJourneys().map((journey) => toJourneyDetail(journey.id));
  return res.json(journeys.filter(Boolean));
});

function toJourneyDetail(journeyId: string) {
  const journey = dataStore.getJourneyWithRelations(journeyId);
  if (!journey) {
    return null;
  }
  const latestLink = journey.trackingLinks.at(0);
  const response: Record<string, unknown> = {
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
    updatedAt: toIso(journey.updatedAt),
  };
  if (journey.vehicle) {
    response.vehicle = {
      registrationNo: journey.vehicle.registrationNo,
      capacity: journey.vehicle.capacity,
    };
  }
  if (latestLink) {
    response.trackingLink = {
      shareUrl: latestLink.shareUrl,
      expiresAt: toIso(latestLink.expiresAt),
      remainingMinutes: Math.max(0, differenceInMinutes(latestLink.expiresAt, nowUtc())),
    };
  }
  response.bookingCount = dataStore.listBookingsForJourney(journey.id).length;
  return response;
}
