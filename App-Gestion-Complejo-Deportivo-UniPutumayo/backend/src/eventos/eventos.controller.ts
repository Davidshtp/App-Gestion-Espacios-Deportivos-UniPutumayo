// src/eventos/eventos.controller.ts
import {Controller,Post,Get,Put,Body,Param,UseGuards,UseInterceptors,UploadedFile,ParseIntPipe,Patch,} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerImageOptions } from 'src/common/configs/multer.config';
import { EventosService } from './eventos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { EventoEntity } from './entity/evento.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', multerImageOptions))
  async createEvento(
    @Body() createEventoDto: CreateEventoDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<EventoEntity> {
    return this.eventosService.crearEvento(createEventoDto, file);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', multerImageOptions)) // Opciones para imágenes
  async updateEvento(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventoDto: UpdateEventoDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<EventoEntity> {
    return this.eventosService.actualizarEvento(id, updateEventoDto, file);
  }

  @Patch(':id/eliminar')
  async eliminarEvento(@Param('id') id: string) {
    return this.eventosService.softDeleteEvento(+id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllEventosForAdmin(): Promise<EventoEntity[]> {
    return this.eventosService.listarEventos();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getPublicEvents(): Promise<EventoEntity[]> {
    return this.eventosService.listarEventos();
  }

  @Get('count-activos')
  @UseGuards(JwtAuthGuard)
  async contarActivos() {
    const total = await this.eventosService.contarEventosActivos();
    return { total };
  }


}