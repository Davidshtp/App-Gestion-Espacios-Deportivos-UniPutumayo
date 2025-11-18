import { IsNotEmpty, IsString } from 'class-validator';

export class CheckInDto {
  @IsNotEmpty()
  @IsString()
  qrData: string;
}
