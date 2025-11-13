import { IsEmail, IsOptional, IsPhoneNumber, IsString, Length, ValidateIf } from 'class-validator';

export class RequestOtpDto {
  @IsOptional()
  @IsPhoneNumber('IN', { message: 'Phone number must be in E.164 format for India (e.g. +919876543210)' })
  readonly phone?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ValidateIf((o) => o.code !== undefined)
  @IsString()
  @Length(6, 6)
  readonly code?: string;
}
