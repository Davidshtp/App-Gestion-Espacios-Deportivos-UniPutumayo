import { IsString } from 'class-validator';

export class CreateDeporteDto {
  @IsString()
  nombre: string;
}
