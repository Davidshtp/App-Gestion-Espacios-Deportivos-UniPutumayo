// src/reserva/dto/create-reserva.dto.ts (o donde tengas tu DTO)
import { IsDateString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateReservaDto {
  @IsDateString()
  @IsNotEmpty()
  fecha_hora: string;

  @IsInt()
  @IsNotEmpty()
  usuario_id: number;

  @IsInt()
  @IsNotEmpty()
  espacio_id: number;

  @IsInt()
  @IsOptional()
  deporte_id?: number;

  @IsInt()
  @IsOptional()
  evento_id?: number;
}
