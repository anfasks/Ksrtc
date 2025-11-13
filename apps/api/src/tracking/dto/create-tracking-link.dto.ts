import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateTrackingLinkDto {
  @IsUrl()
  @MaxLength(500)
  readonly shareUrl!: string;

  @Type(() => Date)
  @IsDate()
  readonly expiresAt!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  readonly notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  readonly source?: string;
}
