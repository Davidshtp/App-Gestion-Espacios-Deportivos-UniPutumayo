import { Controller, Get, UseGuards } from '@nestjs/common';
import { DeportesService } from './deportes.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('deportes')
export class DeportesController {
  constructor(private readonly deportesService: DeportesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('obtener-deportes')
  async listarDeportes() {
    return await this.deportesService.obtenerDeportes();
  }
}
