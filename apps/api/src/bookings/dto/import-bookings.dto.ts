import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BookingImportItemDto } from './booking-import-item.dto';

export class ImportBookingsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingImportItemDto)
  bookings?: BookingImportItemDto[];

  @IsOptional()
  @IsString()
  csv?: string;
}
