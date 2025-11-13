import { IsEmail, IsOptional, Matches, ValidateIf } from 'class-validator';

export class RequestOtpDto {
  @ValidateIf((dto) => !dto.email)
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be an E.164 number',
  })
  phone?: string;

  @ValidateIf((dto) => !dto.phone)
  @IsEmail()
  email?: string;

  @IsOptional()
  channel?: 'sms' | 'email';
}
