import { randomInt } from 'crypto';

interface OtpRecord {
  otp: string;
  expiresAt: Date;
}

function toKey(identifier: { phone?: string; email?: string }): string {
  if (identifier.phone) {
    return `phone:${identifier.phone}`;
  }
  if (identifier.email) {
    return `email:${identifier.email.toLowerCase()}`;
  }
  throw new Error('Phone or email required');
}

export class OtpService {
  private readonly store = new Map<string, OtpRecord>();
  private readonly expiryMinutes: number;

  constructor(expiryMinutes = 10) {
    this.expiryMinutes = expiryMinutes;
  }

  generateOtp(identifier: { phone?: string; email?: string }): string {
    const key = toKey(identifier);
    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);
    this.store.set(key, { otp, expiresAt });
    return otp;
  }

  verifyOtp(identifier: { phone?: string; email?: string }, otp: string): boolean {
    const key = toKey(identifier);
    const record = this.store.get(key);
    if (!record) {
      return false;
    }
    if (record.otp !== otp) {
      return false;
    }
    if (record.expiresAt.getTime() < Date.now()) {
      this.store.delete(key);
      return false;
    }
    this.store.delete(key);
    return true;
  }
}

export const otpService = new OtpService();
