// src/reservas/dto/cancelar-reserva.dto.ts
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CancelarReservaDto {
  @IsNotEmpty()
  @IsString()
  fecha_hora: string;

  @IsNotEmpty()
  @IsNumber()
  espacio_id: number;
}
