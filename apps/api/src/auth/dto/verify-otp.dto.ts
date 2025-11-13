import { IsEmail, IsNotEmpty, IsOptional, Matches, ValidateIf } from 'class-validator';

export class VerifyOtpDto {
  @ValidateIf((dto) => !dto.email)
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone?: string;

  @ValidateIf((dto) => !dto.phone)
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  otp!: string;
}
