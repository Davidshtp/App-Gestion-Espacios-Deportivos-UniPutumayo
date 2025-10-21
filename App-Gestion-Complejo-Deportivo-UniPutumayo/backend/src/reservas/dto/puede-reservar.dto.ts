import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class PuedeReservarDto {
  @IsNotEmpty()
  @IsInt()
  usuario_id: number;

  @IsNotEmpty()
  @IsString() // También puedes usar @IsISO8601 si quieres validar el formato de fecha
  fecha: string; // formato ISO tipo "2025-07-15T10:00:00"
}
