// src/reservas/dto/obtener-reservas.dto.ts
import { IsDateString, IsInt } from 'class-validator';

export class ObtenerReservasDto {
  @IsDateString()
  fecha: string;

  @IsInt()
  espacioId: number;
}
