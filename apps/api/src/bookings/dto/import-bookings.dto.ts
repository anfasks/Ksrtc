import { BookingStatus } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class BookingUserDto {
  @IsOptional()
  @IsPhoneNumber('IN')
  readonly phone?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;
}

class BookingPayloadDto {
  @IsString()
  @MaxLength(40)
  readonly bookingId!: string;

  @IsString()
  @MaxLength(40)
  readonly pnr!: string;

  @IsString()
  readonly journeyId!: string;

  @IsOptional()
  @IsString()
  readonly seatNo?: string;

  @IsEnum(BookingStatus)
  readonly status!: BookingStatus;

  @ValidateNested()
  @Type(() => BookingUserDto)
  readonly user!: BookingUserDto;
}

export class ImportBookingsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BookingPayloadDto)
  readonly bookings!: BookingPayloadDto[];
}
