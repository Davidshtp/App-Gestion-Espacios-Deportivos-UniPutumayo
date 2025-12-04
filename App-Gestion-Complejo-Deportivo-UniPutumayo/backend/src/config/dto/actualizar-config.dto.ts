import { IsString, IsInt, IsOptional, IsPositive } from 'class-validator';

export class ActualizarConfigDto {
  @IsString()
  clave: string;

  @IsInt()
  @IsPositive()
  valor: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
