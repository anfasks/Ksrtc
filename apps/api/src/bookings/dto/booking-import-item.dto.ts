import { IsEmail, IsOptional, IsString } from 'class-validator';

export class BookingImportItemDto {
  @IsString()
  bookingId!: string;

  @IsString()
  pnr!: string;

  @IsString()
  journeyId!: string;

  @IsOptional()
  @IsString()
  seatNo?: string;

  @IsOptional()
  @IsEmail()
  userEmail?: string;

  @IsOptional()
  @IsString()
  userPhone?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
