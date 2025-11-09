// src/eventos/dto/create-evento.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsDateString,
} from 'class-validator';
// Ya no necesitamos 'Transform' si el frontend envía el formato correcto directamente

export class CreateEventoDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  descripcion?: string;

  @IsOptional()
  @IsUrl(
    {},
    { message: 'La URL de la imagen del evento debe ser una URL válida.' },
  )
  url_imagen_evento?: string;

  @IsDateString(
    {},
    {
      message:
        'La fecha y hora del evento deben ser un formato de fecha válido (ISO 8601).',
    },
  )
  @IsNotEmpty({ message: 'La fecha y hora del evento son obligatorias.' })
  fecha_hora_evento: string; // ¡Cambia el tipo a 'string' aquí!
}
