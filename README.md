# KSRTC Bus Tracking Platform

This repository documents the end-to-end solution for a KSRTC-branded passenger tracking experience across Android, iOS, and web. The system uses Google Maps live tracking links for each bus journey and resolves them via booking ID or PNR lookup.

## What’s Inside

- `docs/architecture.md` – cross-platform architecture, technology stack, and high-level flows.
- `docs/api-design.md` – database schema, REST contracts, and background job design.
- `docs/implementation-guide.md` – step-by-step setup with sample NestJS and Flutter snippets.

## Summary

1. Operations staff attach Google Maps live tracking links to each scheduled journey.
2. The backend (NestJS + PostgreSQL) stores routes, bookings, and tracking metadata.
3. Passengers enter their booking ID/PNR in the Flutter app (Android, iOS, web) to retrieve the live bus location or deep link into Google Maps.

The documentation covers authentication, link lifecycle handling, deployment, and observability to fast-track implementation.
