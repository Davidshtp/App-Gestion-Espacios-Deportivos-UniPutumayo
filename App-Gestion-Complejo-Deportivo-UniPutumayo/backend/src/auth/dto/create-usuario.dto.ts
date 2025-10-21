import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty()
  nombre: string;

  @IsNotEmpty()
  apellido: string;

  @IsNotEmpty()
  identificacion: string;

  @IsNotEmpty()
  @MinLength(6)
  contrasena: string;

  @IsNotEmpty()
  rolId: number;
}
