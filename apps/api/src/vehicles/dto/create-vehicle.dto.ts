import { IsInt, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MaxLength(20)
  readonly registrationNo!: string;

  @IsInt()
  @IsPositive()
  readonly capacity!: number;
}
