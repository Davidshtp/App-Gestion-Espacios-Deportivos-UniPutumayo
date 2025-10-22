import { IsString } from "class-validator";

// update-deporte.dto.ts
export class UpdateDeporteDto {
    @IsString()
    nombre?: string;
}