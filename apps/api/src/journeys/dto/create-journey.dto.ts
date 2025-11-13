import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { JourneyStatus } from '@prisma/client';

export class CreateJourneyDto {
  @IsString()
  readonly routeId!: string;

  @IsOptional()
  @IsString()
  readonly vehicleId?: string;

  @Type(() => Date)
  @IsDate()
  readonly serviceDate!: Date;

  @Type(() => Date)
  @IsDate()
  readonly departureTime!: Date;

  @Type(() => Date)
  @IsDate()
  readonly arrivalTime!: Date;

  @IsOptional()
  @IsEnum(JourneyStatus)
  readonly status?: JourneyStatus;
}
