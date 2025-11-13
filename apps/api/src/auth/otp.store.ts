import { Injectable } from '@nestjs/common';

interface OtpRecord {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class OtpStore {
  private readonly storage = new Map<string, OtpRecord>();

  set(key: string, code: string, ttlSeconds: number): void {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    this.storage.set(key, { code, expiresAt });
  }

  verify(key: string, code: string): boolean {
    const record = this.storage.get(key);
    if (!record) {
      return false;
    }

    const now = new Date();
    if (now > record.expiresAt) {
      this.storage.delete(key);
      return false;
    }

    const match = record.code === code;
    if (match) {
      this.storage.delete(key);
    }

    return match;
  }
}
