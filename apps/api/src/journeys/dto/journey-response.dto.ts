export class JourneyStopDto {
  name!: string;
  lat!: number;
  lng!: number;
  scheduledTime?: string;
  address?: string | null;
}

export class JourneySummaryDto {
  id!: string;
  routeCode!: string;
  status!: string;
  serviceDate!: string;
  departureTime!: string;
  arrivalTime!: string;
  origin!: JourneyStopDto;
  destination!: JourneyStopDto;
}

export class TrackingLinkDto {
  shareUrl!: string;
  expiresAt!: string;
  remainingMinutes!: number;
  issuedAt!: string;
}

export class JourneyDetailResponse {
  journey!: JourneySummaryDto;
  trackingLink?: TrackingLinkDto | null;
}
