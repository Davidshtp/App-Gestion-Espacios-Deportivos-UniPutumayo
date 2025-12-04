import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionEntity } from './entity/config.entity';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(ConfiguracionEntity)
    private configRepo: Repository<ConfiguracionEntity>,
  ) {
    this.inicializarConfiguracion();
  }

  // Inicializar configuración por defecto si no existe
  private async inicializarConfiguracion() {
    const configs = [
      {
        clave: 'qr_minutos_antes',
        valor: 5,
        descripcion: 'Minutos antes de la hora de inicio para generar QR',
      },
      {
        clave: 'qr_minutos_despues',
        valor: 15,
        descripcion: 'Minutos después de la hora de inicio para escanear QR',
      },
    ];

    for (const config of configs) {
      const existe = await this.configRepo.findOne({
        where: { clave: config.clave },
      });

      if (!existe) {
        await this.configRepo.save(config);
      }
    }
  }

  // Obtener un valor de configuración
  async obtenerConfig(clave: string): Promise<number> {
    const config = await this.configRepo.findOne({ where: { clave } });
    return config?.valor || (clave === 'qr_minutos_antes' ? 5 : 15);
  }

  // Obtener todas las configuraciones
  async obtenerTodasLasConfigs() {
    return this.configRepo.find();
  }

  // Actualizar configuración
  async actualizarConfig(clave: string, valor: number, descripcion?: string) {
    const config = await this.configRepo.findOne({ where: { clave } });

    if (config) {
      config.valor = valor;
      if (descripcion) config.descripcion = descripcion;
      return this.configRepo.save(config);
    } else {
      return this.configRepo.save({
        clave,
        valor,
        descripcion,
      });
    }
  }
}
