// src/espacio/dto/create-espacio.dto.ts
import {
  IsString,
  Length,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateEspacioDto {
  @IsString()
  @Length(3, 25)
  espacio: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Debe seleccionar al menos un deporte.' })
  deportes?: number[]; // array de IDs de deportes

  @IsOptional()
  @IsString()
  qr_code?: string;
}
