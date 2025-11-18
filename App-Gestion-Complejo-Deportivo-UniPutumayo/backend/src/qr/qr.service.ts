import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReservaEntity } from "src/reservas/entity/reservas.entity";
import * as crypto from "crypto";
import { AppGateway } from "src/gateways/app.gateway";

@Injectable()
export class QrService {
  constructor(
    @InjectRepository(ReservaEntity)
    private readonly reservaRepo: Repository<ReservaEntity>,
    private readonly reservasGateway: AppGateway,
  ) {}

  private ventanas(fechaInicio: Date) {
    const availableFrom = new Date(fechaInicio.getTime() - 5 * 60 * 1000);
    const expiresAt = new Date(fechaInicio.getTime() + 15 * 60 * 1000);
    return { availableFrom, expiresAt };
  }

  async generarQrParaReserva(reservaId: number) {
    const reserva = await this.reservaRepo.findOne({ where: { id_reserva: reservaId } });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    const token = crypto.randomBytes(32).toString('hex');
    const { availableFrom, expiresAt } = this.ventanas(reserva.fecha_hora);

    reserva.qr_token = token;
    reserva.qr_available_from = availableFrom;
    reserva.qr_expires_at = expiresAt;
    reserva.qr_used_at = null;

    await this.reservaRepo.save(reserva);
    this.reservasGateway.emitirNovedadReserva?.();

    return {
      reservaId: reserva.id_reserva,
      token,
      qrUrl: `https://tu-dominio.com/checkin/scan/${reserva.id_reserva}?t=${token}`,
      availableFrom,
      expiresAt,
    };
  }

  async validarQr(reservaId: number, token: string) {
    const reserva = await this.reservaRepo.findOne({ where: { id_reserva: reservaId } });

    if (!reserva) throw new NotFoundException("QR no válido");
    if (!reserva.qr_token || reserva.qr_token !== token) throw new NotFoundException("Token inválido");

    const ahora = new Date();

    if (reserva.qr_available_from && ahora < new Date(reserva.qr_available_from)) {
      return { valido: false, mensaje: 'QR no disponible todavía', disponibleDesde: reserva.qr_available_from };
    }

    if (reserva.qr_expires_at && ahora > new Date(reserva.qr_expires_at)) {
      return { valido: false, mensaje: 'QR expirado' };
    }

    if (reserva.qr_used_at) {
      return { valido: false, mensaje: 'Este código QR ya fue utilizado', fechaUso: reserva.qr_used_at };
    }

    // Marcar como usado y actualizar estado de la reserva
    reserva.qr_used_at = ahora;

    const inicio = new Date(reserva.fecha_hora);
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);

    if (ahora < inicio) {
      reserva.estado = 'check_in_previo';
    } else if (ahora >= inicio && ahora < fin) {
      reserva.estado = 'en_uso';
    } else {
      // si pasa fuera de la ventana, marcar apropiadamente
      reserva.estado = 'usado';
    }

    await this.reservaRepo.save(reserva);
    this.reservasGateway.emitirNovedadReserva?.();

    return {
      valido: true,
      mensaje: 'Check-in exitoso',
      reservaId: reserva.id_reserva,
      fechaUso: reserva.qr_used_at,
      estado: reserva.estado,
    };
  }
}
