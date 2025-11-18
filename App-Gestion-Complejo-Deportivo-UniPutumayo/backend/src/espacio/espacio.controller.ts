// src/espacio/espacio.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EspacioService } from './espacio.service';
import { CreateEspacioDto } from './dto/create-espacio.dto';
import { UpdateEspacioDto } from './dto/update-espacio.dto';
import { EspacioEntity } from './entity/espacio.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { multerImageOptions } from 'src/common/configs/multer.config';

@Controller('espacio')
export class EspacioController {
  constructor(private readonly espacioService: EspacioService) {}

  @Get(':id/deportes')
  @UseGuards(JwtAuthGuard)
  async obtenerDeportesDeEspacio(@Param('id', ParseIntPipe) id: number) {
    return this.espacioService.obtenerDeportesDeEspacio(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async obtenerTodos(): Promise<EspacioEntity[]> {
    return this.espacioService.obtenerTodos();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EspacioEntity> {
    return this.espacioService.obtenerPorId(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', multerImageOptions))
  async crearEspacio(
    @Body() dto: CreateEspacioDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<EspacioEntity> {
    if (!file) {
      throw new BadRequestException(
        'La imagen es obligatoria para crear un espacio.',
      );
    }
    return this.espacioService.crearEspacio(dto, file);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', multerImageOptions))
  async actualizarEspacio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEspacioDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<EspacioEntity> {
    return this.espacioService.actualizarEspacio(id, dto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async eliminarEspacio(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.espacioService.eliminarEspacio(id);
    return { message: 'Espacio eliminado correctamente' };
  }
}
