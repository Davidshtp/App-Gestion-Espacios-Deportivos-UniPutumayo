// reservas.controller.ts
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Query,
  Delete,
  Patch,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ObtenerReservasDto } from './dto/obtener-reservas.dto';
import { CancelarReservaDto } from './dto/cancelar-reserva.dto';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MarcarReservaEnUsoDto } from './dto/marcar-uso.dto';
import { PonerEnUsoLibreDto } from './dto/poner-en-uso-libre.dto';
import * as fs from 'fs';
import * as path from 'path';

@Controller('reservas')
@UseGuards(JwtAuthGuard)
export class ReservasController {
  constructor(private readonly reservaService: ReservasService) {}

  // Crear reserva con fecha_hora
  @Post('crear-reserva')
  crear(@Body() dto: CreateReservaDto, @Req() req: Request) {
    const usuarioId = req.user.userId;
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
    const user = req.user;
    return this.reservaService.cancelarReserva(dto, user);
  }

  // Marcar reserva como "en uso" con fecha_hora
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('marcar-en-uso')
  marcarEnUso(@Body() dto: MarcarReservaEnUsoDto, @Req() req: Request) {
    const user = req.user;
    return this.reservaService.marcarReservaEnUso(dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('liberar')
  async liberarReservaEnUso(
    @Body() dto: PonerEnUsoLibreDto,
    @Req() req: Request,
  ) {
    const user = req.user;

    return this.reservaService.ponerEnUsoLibre(dto, user);
  }

  // Obtener reservas activas del usuario autenticado
  @Get('mis-reservas-activas')
  async obtenerMisReservasActivas(@Req() req: Request) {
    const usuarioId = req.user.userId;
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
    const usuarioId = req.user.userId;
    const total =
      await this.reservaService.contarReservasActivasPorUsuario(usuarioId);
    return { total };
  }

  @Get('horas-totales')
  async obtenerHorasTotalesUso(@Req() req: Request) {
    const usuarioId = req.user.userId;
    const resultado =
      await this.reservaService.obtenerHorasTotalesDeUso(usuarioId);
    return resultado;
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('reservar-todo-el-dia')
  async reservarTodoElDia(
    @Body() body: { espacioId: number; fecha: string },
    @Req() req: Request,
  ) {
    const user = req.user;

    if (!body.espacioId || !body.fecha) {
      throw new BadRequestException(
        'El ID del espacio y la fecha son obligatorios',
      );
    }

    return this.reservaService.reservarTodoElDia(
      body.espacioId,
      body.fecha,
      user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('check-in')
  @UseInterceptors(FileInterceptor('qrImage'))
  async checkIn(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ninguna imagen.');
    }
    const user = { userId: req.user.userId };
    return this.reservaService.checkIn(file, user);
  }

  // ======================= RUTA DE PRUEBA TEMPORAL ===========================
  @UseGuards(JwtAuthGuard)
  @Get('check-in-test') // Usamos GET para que sea fácil de probar en el navegador
  async checkInTest(@Req() req: Request) {
    // Especifica la ruta a la imagen QR dentro del proyecto backend
    const pathToImage = path.join(
      __dirname,
      '..', // Sube un nivel a 'dist'
      '..', // Sube otro nivel a la raíz del backend
      'assets', // Entra a la carpeta assets
      'QR_Esp1.png', // El nombre de tu archivo de imagen
    );

    if (!fs.existsSync(pathToImage)) {
      throw new NotFoundException(
        `El archivo de prueba no se encontró en: ${pathToImage}`,
      );
    }

    // Lee el archivo y crea un objeto 'file' simulado como el que usa Multer
    const buffer = fs.readFileSync(pathToImage);
    const mockFile: Express.Multer.File = {
      buffer,
    } as Express.Multer.File; // Hacemos un cast para que coincida con el tipo esperado

    // Llama a la lógica original de checkIn con el archivo simulado
    const user = { userId: req.user.userId };
    return this.reservaService.checkIn(mockFile, user);
  }
}
