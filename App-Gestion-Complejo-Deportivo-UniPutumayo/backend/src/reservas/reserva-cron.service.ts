import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, Between, In, Not } from 'typeorm';
import { ReservaEntity } from './entity/reservas.entity';
import * as crypto from 'crypto';
import { AppGateway } from 'src/gateways/app.gateway';
import { EspacioEntity } from 'src/espacio/entity/espacio.entity';
import { QrService } from 'src/qr/qr.service';

@Injectable()
export class ReservaCronService {
  private readonly logger = new Logger(ReservaCronService.name);
  constructor(
    @InjectRepository(ReservaEntity)
    private readonly reservaRepository: Repository<ReservaEntity>,
    @InjectRepository(EspacioEntity)
    private readonly espacioRepo: Repository<EspacioEntity>,
    private readonly reservasGateway: AppGateway,
    private readonly qrService: QrService,
  ) { }
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
    });

    for (const r of pendientes) {
      await this.qrService.generarQrParaReserva(r.id_reserva);
    }
  }

  async onModuleInit() {
    this.logger.log('Verificación inicial de reservas...');
    await this.actualizarReservas();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async actualizarReservasCadaMinuto() {
    await this.actualizarReservas();
  }

  private async actualizarReservas() {
    const ahora = new Date();
    // Usar la fecha local en lugar de UTC
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    const hoy = `${year}-${month}-${day}`;
    const inicioDia = new Date(`${hoy}T00:00:00.000-05:00`); // Colombia timezone
    const finDia = new Date(`${hoy}T23:59:59.999-05:00`);
    let huboCambios = false;

    // Primero veamos TODAS las reservas sin filtro de fecha
    const todasLasReservas = await this.reservaRepository.find({
      relations: ['usuario', 'usuario.rol', 'espacio'],
    });

    // Luego filtremos por hoy
    const reservas = await this.reservaRepository.find({
      where: { fecha_hora: Between(inicioDia, finDia) },
      relations: ['usuario', 'usuario.rol', 'espacio'],
    });

    // Si no hay reservas para hoy, mostremos algunas fechas de ejemplo
    if (reservas.length === 0 && todasLasReservas.length > 0) { 
      todasLasReservas.slice(0, 5).forEach(r => {
      });
    }

    for (const reserva of reservas) {
      const inicio = new Date(reserva.fecha_hora);
      const fin = new Date(inicio.getTime() + 60 * 60 * 1000); 
      // Cuando la hora actual coincide con la hora de inicio
      if (reserva.estado === 'reservado' && ahora >= inicio && ahora < fin) {
  
        // Si es admin (rol id = 1), pasa directamente a 'en_uso'
        if (reserva.usuario && reserva.usuario.rol && reserva.usuario.rol.id_rol === 1) {
          reserva.estado = 'en_uso';
        } else {
          // Si no es admin, pasa a 'esperando' (necesita check-in)
          reserva.estado = 'esperando';
        }
        await this.reservaRepository.save(reserva);
        huboCambios = true;
        continue;
      }
      if (reserva.estado === 'check_in_previo' && ahora >= inicio && ahora < fin) {
        reserva.estado = 'en_uso';
        await this.reservaRepository.save(reserva);
        huboCambios = true;
        continue;
      }

      if (
        reserva.estado === 'esperando' &&
        ahora >= new Date(inicio.getTime() + 15 * 60 * 1000)
      ) {
        reserva.estado = 'cancelado';
        await this.reservaRepository.save(reserva);
        const nuevaReserva = this.reservaRepository.create({
          fecha_hora: reserva.fecha_hora,
          espacio: reserva.espacio,
          estado: 'uso_libre',
        });

        await this.reservaRepository.save(nuevaReserva);

        huboCambios = true;
        continue;
      }

      if (['en_uso', 'uso_libre'].includes(reserva.estado) && ahora >= fin) {
        reserva.estado = 'usado';
        await this.reservaRepository.save(reserva);
        huboCambios = true;
        continue;
      }

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
