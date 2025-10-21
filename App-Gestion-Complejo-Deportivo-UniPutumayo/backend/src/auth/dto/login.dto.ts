import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  identificacion: string;

  @IsNotEmpty()
  @MinLength(6)
  contrasena: string;
}
