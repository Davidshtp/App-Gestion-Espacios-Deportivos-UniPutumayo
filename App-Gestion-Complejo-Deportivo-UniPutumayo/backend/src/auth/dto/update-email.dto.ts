import { IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  correo: string;
}