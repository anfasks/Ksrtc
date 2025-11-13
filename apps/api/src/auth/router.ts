import { Router } from 'express';
import { z } from 'zod';

import { dataStore } from '../data/store';
import { issueTokens, refreshAccessToken, revokeRefreshToken } from './tokenService';
import { otpService } from './otpService';

const requestOtpSchema = z
  .object({
    phone: z.string().min(8).max(20).optional(),
    email: z.string().email().optional(),
  })
  .refine((value) => value.phone || value.email, {
    message: 'Phone or email is required',
    path: ['phone'],
  });

const verifyOtpSchema = requestOtpSchema.extend({
  otp: z.string().length(6),
  role: z.enum(['PASSENGER', 'STAFF']).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const authRouter = Router();

authRouter.post('/request-otp', (req, res) => {
  const parseResult = requestOtpSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'ValidationError', details: parseResult.error.flatten() });
  }
  const identifier = parseResult.data;
  const otp = otpService.generateOtp(identifier);
  // In production you would send the OTP via SMS/email. For demo we return it.
  return res.json({
    message: 'OTP generated successfully',
    demoOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
  });
});

authRouter.post('/verify-otp', (req, res) => {
  const parseResult = verifyOtpSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'ValidationError', details: parseResult.error.flatten() });
  }
  const { otp, role, ...identifier } = parseResult.data;
  const verified = otpService.verifyOtp(identifier, otp);
  if (!verified) {
    return res.status(401).json({ error: 'OtpInvalid', message: 'OTP invalid or expired' });
  }
  const user = dataStore.upsertUserByContact({
    ...identifier,
    role: role ?? 'PASSENGER',
  });
  const tokens = issueTokens({ id: user.id, role: user.role });
  return res.json({
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
    tokens,
  });
});

authRouter.post('/refresh', (req, res) => {
  const parseResult = refreshSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'ValidationError', details: parseResult.error.flatten() });
  }
  const tokens = refreshAccessToken(parseResult.data.refreshToken);
  if (!tokens) {
    return res.status(401).json({ error: 'RefreshTokenInvalid', message: 'Unable to refresh token' });
  }
  return res.json({ tokens });
});

authRouter.post('/logout', (req, res) => {
  const parseResult = refreshSchema.safeParse(req.body);
  if (parseResult.success) {
    revokeRefreshToken(parseResult.data.refreshToken);
  }
  return res.status(204).send();
});
