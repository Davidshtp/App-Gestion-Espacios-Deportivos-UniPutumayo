// reservas.controller.ts
import { Body, Controller, Post, UseGuards, Req, Get, Query, Delete, Patch, Request } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ObtenerReservasDto } from './dto/obtener-reservas.dto';
import { CancelarReservaDto } from './dto/cancelar-reserva.dto';
import { MarcarReservaEnUsoDto } from './dto/marcar-uso.dto';
import { PonerEnUsoLibreDto } from './dto/poner-en-uso-libre.dto';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservaService: ReservasService) { }

  // Crear reserva con fecha_hora
  @UseGuards(JwtAuthGuard)
  @Post('crear-reserva')
  crear(@Body() dto: CreateReservaDto, @Req() req: Request) {
    const usuarioId = req['user'].userId;
    return this.reservaService.crearReserva({
      ...dto,
      usuario_id: usuarioId,
    });
  }

  // Obtener reservas del día (sigue usando "fecha" simple para este caso)
  @UseGuards(JwtAuthGuard)
  @Get('reservas-por-dia')
  obtenerPorDia(@Query() dto: ObtenerReservasDto) {
    return this.reservaService.obtenerReservasPorDiaYEspacio(dto);
  }


  // Cancelar reserva con fecha_hora
  @UseGuards(JwtAuthGuard)
  @Post('cancelar')
  cancelarReserva(@Body() dto: CancelarReservaDto, @Req() req: Request) {
    const user = req['user'];
    return this.reservaService.cancelarReserva(dto, user);
  }

  // Marcar reserva como "en uso" con fecha_hora
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('marcar-en-uso')
  marcarEnUso(@Body() dto: MarcarReservaEnUsoDto, @Req() req: Request) {
    const user = req['user'];
    return this.reservaService.marcarReservaEnUso(dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('liberar')
  async liberarReservaEnUso(@Body() dto: PonerEnUsoLibreDto, @Req() req: Request) {
    const user = {
      userId: req['user'].userId,
      rolId: req['user'].rolId,
    };

    return this.reservaService.ponerEnUsoLibre(dto, user);
  }

  // Obtener reservas activas del usuario autenticado
  @UseGuards(JwtAuthGuard)
  @Get('mis-reservas-activas')
  async obtenerMisReservasActivas(@Req() req: Request) {
    const usuarioId = req['user'].userId;
    return this.reservaService.obtenerReservasActivasDeUsuario(usuarioId);
  }



}
