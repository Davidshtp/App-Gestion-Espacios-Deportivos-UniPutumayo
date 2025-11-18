import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, Between, In, Not } from 'typeorm';
import { ReservaEntity } from './entity/reservas.entity';
import * as crypto from 'crypto';
import { AppGateway } from 'src/gateways/app.gateway';
import { EspacioEntity } from 'src/espacio/entity/espacio.entity';

@Injectable()
export class ReservaCronService {
  private readonly logger = new Logger(ReservaCronService.name);

  constructor(
    @InjectRepository(ReservaEntity)
    private readonly reservaRepository: Repository<ReservaEntity>,

    @InjectRepository(EspacioEntity)
    private readonly espacioRepo: Repository<EspacioEntity>,

    private readonly reservasGateway: AppGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('🔄 Verificación inicial de reservas...');
    await this.actualizarReservas();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async actualizarReservasCadaMinuto() {
    await this.actualizarReservas();
  }

  // Lógica central para actualizar el estado de reservas
  private async actualizarReservas() {
    const ahora = new Date();
    const hoy = ahora.toISOString().slice(0, 10);
    const inicioDia = new Date(`${hoy}T00:00:00`);
    const finDia = new Date(`${hoy}T23:59:59`);

    let huboCambios = false;

    // Obtener todas las reservas del día con sus relaciones
    const reservas = await this.reservaRepo.find({
      where: { fecha_hora: Between(inicioDia, finDia) },
      relations: ['usuario', 'espacio'],
    });

    for (const reserva of reservas) {
      const inicioHora = new Date(reserva.fecha_hora);
      const finHora = new Date(inicioHora.getTime() + 60 * 60 * 1000); // +1 hora

      // Pasar a "esperando" si la hora ya inició
      if (
        reserva.estado === 'reservado' &&
        ahora >= inicioHora &&
        ahora < finHora
      ) {
        reserva.estado = 'esperando';
        await this.reservaRepo.save(reserva);
        huboCambios = true;
        continue;
      }

      // Pasar a "ausente" si lleva más de 20 minutos en "esperando"
      if (
        reserva.estado === 'esperando' &&
        ahora >= new Date(inicioHora.getTime() + 20 * 60 * 1000)
      ) {
        reserva.estado = 'ausente';
        await this.reservaRepo.save(reserva);
        huboCambios = true;
        continue;
      }

      //  Pasar a "usado" si ya terminó y estaba en uso o libre
      if (
        ['en_uso', 'uso_libre'].includes(reserva.estado) &&
        ahora >= finHora
      ) {
        reserva.estado = 'usado';
        await this.reservaRepository.save(reserva);
        huboCambios = true;
        continue;
      }

      // ---------------------------------------
      // E) TU REGLA FINAL:
      // si estaba reservado y terminó la hora → cancelado
      // ---------------------------------------
      if (reserva.estado === 'reservado' && ahora >= fin) {
        reserva.estado = 'cancelado';
        await this.reservaRepository.save(reserva);
        huboCambios = true;
        continue;
      }
    }

    const horaActual = new Date(ahora);
    horaActual.setMinutes(0, 0, 0);

    const espacios = await this.espacioRepo.find();

    for (const espacio of espacios) {
      const existeReserva = await this.reservaRepository.findOne({
        where: {
          fecha_hora: horaActual,
          espacio: { id_espacio: espacio.id_espacio },
          estado: Not('cancelado'),
        },
      });

      if (!existeReserva) {
        const nueva = this.reservaRepository.create({
          fecha_hora: horaActual,
          espacio,
          estado: 'uso_libre',
        });
        await this.reservaRepository.save(nueva);
        huboCambios = true;
      }
    }

    if (huboCambios) {
      this.reservasGateway.emitirNovedadReserva();
    }
  }
}
