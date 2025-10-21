import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservaEntity } from './entity/reservas.entity';
import { EspacioEntity } from '../espacio/entity/espacio.entity';
import { Between, Not, Repository } from 'typeorm';
import { AppGateway } from 'src/gateways/app.gateway';

@Injectable()
export class ReservaCronService implements OnModuleInit {
  private readonly logger = new Logger(ReservaCronService.name);

  constructor(
    @InjectRepository(ReservaEntity)
    private readonly reservaRepo: Repository<ReservaEntity>,

    @InjectRepository(EspacioEntity)
    private readonly espacioRepo: Repository<EspacioEntity>,

    private readonly reservasGateway: AppGateway,
  ) { }

  //  Ejecutar al iniciar el servidor
  async onModuleInit() {
    this.logger.log('⏳ Ejecutando verificación inicial de reservas...');
    await this.actualizarReservas();
  }

  //  Ejecutar cada minuto automáticamente
  @Cron(CronExpression.EVERY_MINUTE)
  async actualizarReservasCadaMinuto() {
    await this.actualizarReservas();
  }

  // 🔧 Lógica central para actualizar el estado de reservas
  private async actualizarReservas() {
    const ahora = new Date();
    const hoy = ahora.toISOString().slice(0, 10);
    const inicioDia = new Date(`${hoy}T00:00:00`);
    const finDia = new Date(`${hoy}T23:59:59`);
    let huboCambios = false;

    // 🔍 Obtener todas las reservas del día con sus relaciones
    const reservas = await this.reservaRepo.find({
      where: { fecha_hora: Between(inicioDia, finDia) },
      relations: ['usuario', 'espacio'],
    });

    for (const reserva of reservas) {
      const inicioHora = new Date(reserva.fecha_hora);
      const finHora = new Date(inicioHora.getTime() + 60 * 60 * 1000); // +1 hora

      // Pasar a "esperando" si la hora ya inició
      if (reserva.estado === 'reservado' && ahora >= inicioHora && ahora < finHora) {
        reserva.estado = 'esperando';
        await this.reservaRepo.save(reserva);
        huboCambios = true;
        continue;
      }
      // 🕓 Si está en 'reservado' pero la hora ya terminó completamente, cancelarla
      if (reserva.estado === 'reservado' && ahora >= finHora) {
        reserva.estado = 'cancelado';
        await this.reservaRepo.save(reserva);
        huboCambios = true;
        continue;
      }

      // Cancelar si lleva más de 15 minutos en "esperando"
      if (reserva.estado === 'esperando' && ahora >= new Date(inicioHora.getTime() + 15 * 60 * 1000)) {
        reserva.estado = 'cancelado';
        await this.reservaRepo.save(reserva);
        huboCambios = true;
        continue;
      }

      //  Pasar a "usado" si ya terminó y estaba en uso o libre
      if (['en_uso', 'uso_libre'].includes(reserva.estado) && ahora >= finHora) {
        reserva.estado = 'usado';
        await this.reservaRepo.save(reserva);
        huboCambios = true;
      }
    }

    // Crear "uso_libre" si no hay reservas para la hora actual exacta
    const horaActualRedondeada = new Date(ahora);
    horaActualRedondeada.setMinutes(0, 0, 0); // redondear al inicio de la hora

    const espacios = await this.espacioRepo.find();

    for (const espacio of espacios) {
      const existeReserva = await this.reservaRepo.findOne({
        where: {
          fecha_hora: horaActualRedondeada,
          espacio: { id_espacio: espacio.id_espacio },
          estado: Not('cancelado'),
        },
      });

      if (!existeReserva) {
        const nueva = this.reservaRepo.create({
          fecha_hora: horaActualRedondeada,
          espacio,
          estado: 'uso_libre',
        });
        await this.reservaRepo.save(nueva);
        huboCambios = true;
      }
    }

    // Notificar cambios si los hubo
    if (huboCambios) {
      this.reservasGateway.emitirNovedadReserva();
    }
  }
}
