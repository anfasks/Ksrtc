import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { JourneyStatus } from '@prisma/client';

export class CreateJourneyDto {
  @IsString()
  routeId!: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsDateString()
  serviceDate!: string;

  @IsDateString()
  departureTime!: string;

  @IsDateString()
  arrivalTime!: string;

  @IsOptional()
  @IsEnum(JourneyStatus)
  status?: JourneyStatus;
}
