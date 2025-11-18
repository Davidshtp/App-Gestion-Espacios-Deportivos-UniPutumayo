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

  private ventanas(fechaInicio: Date) {
    const availableFrom = new Date(fechaInicio.getTime() - 5 * 60 * 1000);
    const expiresAt = new Date(fechaInicio.getTime() + 15 * 60 * 1000);
    return { availableFrom, expiresAt };
  }

  @Cron('* * * * *')
  async generarTokensPendientes() {
    const now = new Date();
    const en5min = new Date(now.getTime() + 5 * 60 * 1000);

    const pendientes = await this.reservaRepository.find({
      where: {
        estado: In(['reservado', 'esperando', 'check_in_previo']),
        qr_token: IsNull(),
        fecha_hora: Between(now, en5min),
      },
      relations: ['usuario'],
    });

    for (const r of pendientes) {
      const token = crypto.randomBytes(32).toString('hex');
      const { availableFrom, expiresAt } = this.ventanas(r.fecha_hora);

      r.qr_token = token;
      r.qr_available_from = availableFrom;
      r.qr_expires_at = expiresAt;
      r.qr_used_at = null;

      await this.reservaRepository.save(r);
    }
  }

  @Cron('* * * * *')
  async invalidarTokensExpirados() {
    const now = new Date();

    const expirados = await this.reservaRepository.find({
      where: {
        qr_token: Not(IsNull()),
        qr_expires_at: LessThan(now),
      },
    });

    for (const r of expirados) {
      r.qr_token = null;
      r.qr_available_from = null;
      r.qr_expires_at = null;
      await this.reservaRepository.save(r);
    }
  }

  async onModuleInit() {
    this.logger.log('🔄 Verificación inicial de reservas...');
    await this.actualizarReservas();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async actualizarReservasCadaMinuto() {
    await this.actualizarReservas();
  }
  
  private async actualizarReservas() {
    const ahora = new Date();
    const hoy = ahora.toISOString().slice(0, 10);
    const inicioDia = new Date(`${hoy}T00:00:00`);
    const finDia = new Date(`${hoy}T23:59:59`);

    let huboCambios = false;

    const reservas = await this.reservaRepository.find({
      where: { fecha_hora: Between(inicioDia, finDia) },
      relations: ['usuario', 'espacio'],
    });

    for (const reserva of reservas) {
      const inicio = new Date(reserva.fecha_hora);
      const fin = new Date(inicio.getTime() + 60 * 60 * 1000); // +1 hora

      // ---------------------------------------
      // A) Al llegar la hora → esperando (salvo admin → en_uso)
      // ---------------------------------------
      if (reserva.estado === 'reservado' && ahora >= inicio && ahora < fin) {
        // Si el usuario que hizo la reserva es administrador (id_rol === 1),
        // no necesita hacer check-in: marcar directamente como 'en_uso'.
        if (reserva.usuario && reserva.usuario.rol && reserva.usuario.rol.id_rol === 1) {
          reserva.estado = 'en_uso';
        } else {
          reserva.estado = 'esperando';
        }
        await this.reservaRepository.save(reserva);
        huboCambios = true;
        continue;
      }

      // ---------------------------------------
      // B) check_in_previo → en_uso al llegar la hora
      // ---------------------------------------
      if (reserva.estado === 'check_in_previo' && ahora >= inicio && ahora < fin) {
        reserva.estado = 'en_uso';
        await this.reservaRepository.save(reserva);
        huboCambios = true;
        continue;
      }

      // ---------------------------------------
      // C) Si pasan 15 minutos sin check-in → cancelar la reserva y crear nueva de uso_libre
      // ---------------------------------------
      if (
        reserva.estado === 'esperando' &&
        ahora >= new Date(inicio.getTime() + 15 * 60 * 1000)
      ) {
        // Marcar la reserva original como cancelada
        reserva.estado = 'cancelado';
        await this.reservaRepository.save(reserva);

        // Crear una nueva reserva como 'uso_libre' para ese espacio y hora
        const nuevaReserva = this.reservaRepository.create({
          fecha_hora: reserva.fecha_hora,
          espacio: reserva.espacio,
          estado: 'uso_libre',
        });

        await this.reservaRepository.save(nuevaReserva);

        huboCambios = true;
        continue;
      }

      // ---------------------------------------
      // D) Si finaliza la hora y estaba en uso o libre
      // ---------------------------------------
      if (['en_uso', 'uso_libre'].includes(reserva.estado) && ahora >= fin) {
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
