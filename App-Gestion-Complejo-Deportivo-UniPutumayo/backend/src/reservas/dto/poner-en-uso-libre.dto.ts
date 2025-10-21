// src/reservas/dto/poner-en-uso-libre.dto.ts
import { IsString, IsInt } from 'class-validator';

export class PonerEnUsoLibreDto {
  @IsString()
  fecha_hora: string;

  @IsInt()
  espacio_id: number;
}
