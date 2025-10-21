// src/eventos/dto/update-evento.dto.ts
import { IsString, IsOptional, IsUrl, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

const EventoEstado = ['activo', 'inactivo'] as const;
type EventoEstadoType = typeof EventoEstado[number];

export class UpdateEventoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsUrl()
  url_imagen_evento?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  fecha_hora_evento?: Date;

  @IsOptional()
  @IsEnum(EventoEstado)
  estado?: EventoEstadoType;
}