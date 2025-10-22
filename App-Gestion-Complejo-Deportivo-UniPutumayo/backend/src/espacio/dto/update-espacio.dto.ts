// src/espacio/dto/update-espacio.dto.ts
import { IsString, Length, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class UpdateEspacioDto {
  @IsOptional()
  @IsString()
  @Length(3, 25)
  espacio?: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Debe seleccionar al menos un deporte.' })
  deportes?: number[];
}
