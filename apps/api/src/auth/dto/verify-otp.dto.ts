import { IsEmail, IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsOptional()
  @IsPhoneNumber('IN')
  readonly phone?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsString()
  @Length(6, 6)
  readonly otp!: string;
}
