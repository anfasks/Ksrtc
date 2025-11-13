import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateTrackingLinkDto {
  @IsUrl()
  shareUrl!: string;

  @IsDateString()
  expiresAt!: string;

  @IsString()
  @IsNotEmpty()
  issuedBy!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
