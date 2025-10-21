// src/reservas/dto/marcar-uso.dto.ts
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MarcarReservaEnUsoDto {
  @IsString()
  @IsNotEmpty()
  fecha_hora: string;

  @IsNumber()
  espacio_id: number;
}
