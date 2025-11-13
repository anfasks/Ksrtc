import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

import { AuthenticatedUser, JwtPayload, UserRole } from '../types';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RefreshTokenRecord {
  tokenId: string;
  userId: string;
  role: UserRole;
  expiresAt: Date;
}

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const refreshTokens = new Map<string, RefreshTokenRecord>();

function getAccessTokenSecret(): string {
  return process.env.ACCESS_TOKEN_SECRET ?? 'dev-access-secret';
}

function getRefreshTokenSecret(): string {
  return process.env.REFRESH_TOKEN_SECRET ?? 'dev-refresh-secret';
}

export function issueTokens(user: AuthenticatedUser): TokenPair {
  const issuedAt = Math.floor(Date.now() / 1000);
  const accessPayload: JwtPayload = {
    sub: user.id,
    role: user.role,
    iat: issuedAt,
    exp: issuedAt + ACCESS_TOKEN_TTL_SECONDS,
  };

  const accessToken = jwt.sign(accessPayload, getAccessTokenSecret());

  const tokenId = randomUUID();
  const refreshToken = jwt.sign(
    {
      tid: tokenId,
      sub: user.id,
      role: user.role,
      iat: issuedAt,
      exp: issuedAt + REFRESH_TOKEN_TTL_SECONDS,
    },
    getRefreshTokenSecret(),
  );

  refreshTokens.set(tokenId, {
    tokenId,
    userId: user.id,
    role: user.role,
    expiresAt: new Date((issuedAt + REFRESH_TOKEN_TTL_SECONDS) * 1000),
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export function verifyAccessToken(token: string): AuthenticatedUser | null {
  try {
    const payload = jwt.verify(token, getAccessTokenSecret()) as JwtPayload;
    return { id: payload.sub, role: payload.role };
  } catch (error) {
    return null;
  }
}

export function refreshAccessToken(refreshToken: string): TokenPair | null {
  try {
    const decoded = jwt.verify(refreshToken, getRefreshTokenSecret()) as jwt.JwtPayload & {
      tid: string;
      sub: string;
      role: UserRole;
    };
    const record = refreshTokens.get(decoded.tid);
    if (!record) {
      return null;
    }
    if (record.expiresAt.getTime() < Date.now()) {
      refreshTokens.delete(record.tokenId);
      return null;
    }
    const tokens = issueTokens({ id: record.userId, role: record.role });
    refreshTokens.delete(record.tokenId);
    return tokens;
  } catch (error) {
    return null;
  }
}

export function revokeRefreshToken(token: string): void {
  try {
    const decoded = jwt.verify(token, getRefreshTokenSecret()) as jwt.JwtPayload & { tid: string };
    if (decoded.tid) {
      refreshTokens.delete(decoded.tid);
    }
  } catch (error) {
    // ignore invalid token
  }
}
