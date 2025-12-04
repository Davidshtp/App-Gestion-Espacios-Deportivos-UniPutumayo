import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ConfigService } from './config.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ActualizarConfigDto } from './dto/actualizar-config.dto';

@Controller('config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get()
  async obtenerTodasLasConfigs() {
    return this.configService.obtenerTodasLasConfigs();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch()
  async actualizarConfig(@Body() dto: ActualizarConfigDto) {
    const { clave, valor, descripcion } = dto;

    // Validar que sea una configuración permitida
    const configsPermitidas = ['qr_minutos_antes', 'qr_minutos_despues'];
    if (!configsPermitidas.includes(clave)) {
      return { error: 'Configuración no permitida' };
    }

    const resultado = await this.configService.actualizarConfig(
      clave,
      valor,
      descripcion,
    );

    return {
      mensaje: 'Configuración actualizada exitosamente',
      datos: resultado,
    };
  }
}
