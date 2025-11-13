import { IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStopDto {
  @IsString()
  @MaxLength(120)
  readonly name!: string;

  @IsNumber()
  @IsLatitude()
  readonly lat!: number;

  @IsNumber()
  @IsLongitude()
  readonly lng!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly address?: string;
}
