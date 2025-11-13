import { IsString, MaxLength } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @MaxLength(20)
  readonly code!: string;

  @IsString()
  readonly originStopId!: string;

  @IsString()
  readonly destinationStopId!: string;
}
