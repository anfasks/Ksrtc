export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function toIso(date: Date): string {
  return date.toISOString();
}

export function differenceInMinutes(future: Date, from: Date): number {
  return Math.floor((future.getTime() - from.getTime()) / (60 * 1000));
}

export function nowUtc(): Date {
  return new Date();
}
