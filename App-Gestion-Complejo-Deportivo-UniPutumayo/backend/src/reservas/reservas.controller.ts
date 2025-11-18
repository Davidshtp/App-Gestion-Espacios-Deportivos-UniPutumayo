// reservas.controller.ts
import { Body, Controller, Post, UseGuards, Req, Get, Query, Delete, Patch, Request, BadRequestException, Param, Res, ParseIntPipe } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ObtenerReservasDto } from './dto/obtener-reservas.dto';
import { CancelarReservaDto } from './dto/cancelar-reserva.dto';
import { MarcarReservaEnUsoDto } from './dto/marcar-uso.dto';
import { PonerEnUsoLibreDto } from './dto/poner-en-uso-libre.dto';
import { ScanQrDto } from './dto/scan-qr.dto';
import { Response } from 'express';

@Controller('reservas')
@UseGuards(JwtAuthGuard)
export class ReservasController {
  constructor(private readonly reservaService: ReservasService) { }

  // Crear reserva con fecha_hora
  @Post('crear-reserva')
  crear(@Body() dto: CreateReservaDto, @Req() req: Request) {
    const usuarioId = req['user'].userId;
    return this.reservaService.crearReserva({
      ...dto,
      usuario_id: usuarioId,
    });
  }

  // Obtener reservas del día (sigue usando "fecha" simple para este caso)
  @Get('reservas-por-dia')
  obtenerPorDia(@Query() dto: ObtenerReservasDto) {
    return this.reservaService.obtenerReservasPorDiaYEspacio(dto);
  }


  // Cancelar reserva con fecha_hora
  @Post('cancelar')
  cancelarReserva(@Body() dto: CancelarReservaDto, @Req() req: Request) {
    const user = req['user'];
    return this.reservaService.cancelarReserva(dto, user);
  }

  // Marcar reserva como "en uso" con fecha_hora
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('marcar-en-uso')
  marcarEnUso(@Body() dto: MarcarReservaEnUsoDto, @Req() req: Request) {
    const user = req['user'];
    return this.reservaService.marcarReservaEnUso(dto, user);
  }

  @UseGuards(RolesGuard)
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
  @Get('mis-reservas-activas')
  async obtenerMisReservasActivas(@Req() req: Request) {
    const usuarioId = req['user'].userId;
    return this.reservaService.obtenerReservasActivasDeUsuario(usuarioId);
  }

  @Get('dias-completos')
  async obtenerDiasLlenos(@Query('espacioId') espacioId: number) {
    if (!espacioId) {
      throw new BadRequestException('El ID del espacio es obligatorio');
    }
    return this.reservaService.obtenerDiasCompletamenteReservados(espacioId);
  }

  @Get('contar-activas')
  async contarReservasActivasDelUsuario(@Req() req: Request) {
    const usuarioId = req['user'].userId;
    const total = await this.reservaService.contarReservasActivasPorUsuario(usuarioId);
    return { total };
  }

  @Get('horas-totales')
  async obtenerHorasTotalesUso(@Req() req: Request) {
    const usuarioId = req['user'].userId;
    const resultado = await this.reservaService.obtenerHorasTotalesDeUso(usuarioId);
    return resultado;
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('reservar-todo-el-dia')
  async reservarTodoElDia(
    @Body() body: { espacioId: number; fecha: string },
    @Req() req: Request,
  ) {
    const user = {
      userId: req['user'].userId,
      rolId: req['user'].rolId,
    };

    if (!body.espacioId || !body.fecha) {
      throw new BadRequestException('El ID del espacio y la fecha son obligatorios');
    }

    return this.reservaService.reservarTodoElDia(body.espacioId, body.fecha, user);
  }
}
