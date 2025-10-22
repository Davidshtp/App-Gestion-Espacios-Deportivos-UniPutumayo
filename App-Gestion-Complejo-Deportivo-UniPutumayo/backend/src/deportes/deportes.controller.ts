import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DeportesService } from './deportes.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateDeporteDto } from './dto/create-deporte.dto';
import { UpdateDeporteDto } from './dto/update-deporte.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('deportes')
export class DeportesController {
  constructor(private readonly deportesService: DeportesService) { }

  @Get('obtener-deportes')
  @UseGuards(JwtAuthGuard)
  async listarDeportes() {
    return await this.deportesService.obtenerDeportes();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obtenerDeporte(@Param('id', ParseIntPipe) id: number) {
    return await this.deportesService.obtenerDeporte(id);
  }

  @Post('crear')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async crearDeporte(@Body() dto: CreateDeporteDto) {
    return await this.deportesService.crearDeporte(dto);
  }

  @Put('editar/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async actualizarDeporte(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeporteDto,
  ) {
    return await this.deportesService.actualizarDeporte(id, dto);
  }

  @Delete('eliminar/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async eliminarDeporte(@Param('id', ParseIntPipe) id: number) {
    return await this.deportesService.eliminarDeporte(id);
  }
}
