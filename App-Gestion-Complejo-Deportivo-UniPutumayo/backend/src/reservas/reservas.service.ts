import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ReservaEntity } from './entity/reservas.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { EspacioEntity } from 'src/espacio/entity/espacio.entity';
import { DeporteEntity } from 'src/deportes/entity/deportes.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { ObtenerReservasDto } from './dto/obtener-reservas.dto';
import { CancelarReservaDto } from './dto/cancelar-reserva.dto';
import { MarcarReservaEnUsoDto } from './dto/marcar-uso.dto';
import { PonerEnUsoLibreDto } from './dto/poner-en-uso-libre.dto';
import { PuedeReservarDto } from './dto/puede-reservar.dto';
import { EventoEntity } from 'src/eventos/entity/evento.entity';
import { AppGateway } from 'src/gateways/app.gateway';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(ReservaEntity)
    private reservaRepository: Repository<ReservaEntity>,

    @InjectRepository(UserEntity)
    private usuarioRepository: Repository<UserEntity>,

    @InjectRepository(EspacioEntity)
    private espacioRepository: Repository<EspacioEntity>,

    @InjectRepository(DeporteEntity)
    private deporteRepository: Repository<DeporteEntity>,

    @InjectRepository(EventoEntity)
    private readonly eventoRepository: Repository<EventoEntity>,

    private readonly reservasGateway: AppGateway,
  ) { }

  private async getUsuarioConRol(usuario_id: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id },
      relations: ['rol'],
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  private async getEspacio(id: number) {
    const espacio = await this.espacioRepository.findOneBy({ id_espacio: id });
    if (!espacio) throw new NotFoundException('Espacio no encontrado');
    return espacio;
  }

  private async getDeporte(deporteId: number | undefined): Promise<DeporteEntity | null> {

    if (!deporteId) {
      return null
    }
    const deporte = await this.deporteRepository.findOneBy({ id_deporte: deporteId });

    if (!deporte) {
      throw new NotFoundException('Deporte no encontrado');
    }

    return deporte;
  }
  private esHoraExacta(fecha: Date): boolean {
    return (
      fecha.getMinutes() === 0 &&
      fecha.getSeconds() === 0 &&
      fecha.getMilliseconds() === 0
    );
  }
  private async getEvento(eventoId: number | undefined): Promise<EventoEntity | null> {
    if (!eventoId) {
      return null;
    }
    const evento = await this.eventoRepository.findOne({ where: { id_evento: eventoId } });
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }
    return evento;
  }

  private async puedeReservarHoy(dto: PuedeReservarDto): Promise<boolean> {
    const { usuario_id, fecha } = dto;

    const usuario = await this.getUsuarioConRol(usuario_id);
    if (usuario.rol?.id_rol === 1) return true;

    const fechaStr = fecha.split('T')[0]; // O usa new Date(fecha).toISOString().split('T')[0]

    const reservasDelDia = await this.reservaRepository
      .createQueryBuilder('reserva')
      .leftJoin('reserva.usuario', 'usuario')
      .where('usuario.usuario_id = :usuario_id', { usuario_id })
      .andWhere('DATE(reserva.fecha_hora) = :fechaStr', { fechaStr })
      .andWhere('reserva.estado IN (:...estados)', {
        estados: ['reservado', 'en_uso', 'cancelado_antes_de_tiempo', 'esperando'],
      })
      .getCount();

    return reservasDelDia < 1;
  }


  async crearReserva(dto: CreateReservaDto) {
    // Obtener las entidades relacionadas
    const usuario = await this.getUsuarioConRol(dto.usuario_id);
    const espacio = await this.getEspacio(dto.espacio_id);
    const deporte = await this.getDeporte(dto.deporte_id);
    const evento = await this.getEvento(dto.evento_id);
    const fecha = new Date(dto.fecha_hora);

    // Validaciones
    if (!this.esHoraExacta(fecha)) {
      throw new BadRequestException(
        'Solo se permiten reservas a horas exactas (por ejemplo 10:00)',
      );
    }

    // Solo aplicar restricción por día si el usuario es estudiante
    if (usuario.rol.rol === 'estudiante') {
      const puedeReservar = await this.puedeReservarHoy({ usuario_id: usuario.usuario_id, fecha: dto.fecha_hora });
      if (!puedeReservar) {
        throw new BadRequestException(
          'Como estudiante solo puedes tener una reserva por día.',
        );
      }
    }


    const yaExiste = await this.reservaRepository.findOne({
      where: {
        fecha_hora: fecha,
        espacio: { id_espacio: dto.espacio_id },
        estado: In(['reservado', 'en_uso']), // Considerar también 'en_uso' como ocupado
      },
    });

    if (yaExiste) {
      throw new BadRequestException(
        'Ya existe una reserva activa para esta hora y espacio',
      );
    }

    // Crear la nueva reserva
    const nueva = this.reservaRepository.create({
      fecha_hora: fecha,
      usuario,
      espacio,
      deporte, // Asignar deporte (puede ser null)
      evento,   // <-- ¡ASIGNAR EVENTO! (puede ser null)
      estado: 'reservado',
    });

    const guardada = await this.reservaRepository.save(nueva);
    this.reservasGateway.emitirNovedadReserva();

    // Recuperar la reserva completa con todas las relaciones para la respuesta
    const reservaCompleta = await this.reservaRepository.findOne({
      where: { id_reserva: guardada.id_reserva },
      relations: ['usuario', 'espacio', 'deporte', 'evento'], // <-- ¡AÑADIR 'evento' aquí!
    });

    if (!reservaCompleta) {
      throw new InternalServerErrorException('Error al cargar los datos de la reserva');
    }

    return {
      message: 'Reserva creada exitosamente',
      reserva: {
        id: reservaCompleta.id_reserva,
        fecha: reservaCompleta.fecha_hora,
        estado: reservaCompleta.estado,
        espacio: reservaCompleta.espacio.espacio, // Asumo que el espacio tiene una propiedad 'nombre'
        deporte: reservaCompleta.deporte?.nombre ?? '', // Acceso seguro al nombre
        evento: reservaCompleta.evento?.nombre ?? '', // <-- ¡AÑADIR NOMBRE DEL EVENTO!
        usuario: {
          nombre: reservaCompleta.usuario?.nombre ?? '',
          apellido: reservaCompleta.usuario?.apellido ?? '',
        },
      },
    };
  }
  async obtenerReservasPorDiaYEspacio(dto: ObtenerReservasDto) {
    const { fecha, espacioId } = dto;
    const inicio = new Date(`${fecha}T00:00:00`);
    const fin = new Date(`${fecha}T23:59:59`);

    const reservas = await this.reservaRepository.find({
      where: {
        espacio: { id_espacio: espacioId },
        fecha_hora: Between(inicio, fin),
        estado: In(['reservado', 'en_uso', 'esperando', 'uso_libre']),
      },
      relations: ['usuario', 'deporte', 'evento', 'espacio'],
    });
    return reservas.map((r) => ({
      hora: r.fecha_hora.toTimeString().slice(0, 5),
      usuario: r.usuario ? `${r.usuario.nombre} ${r.usuario.apellido}` : null,
      usuario_id: r.usuario?.usuario_id ?? null,
      estado: r.estado,
      deporte_id: r.deporte?.id_deporte ?? null,
      evento: r.evento?.nombre ?? null,
    }));
  }

  async cancelarReserva(dto: CancelarReservaDto, user: { userId: number; rolId: number },
  ) {
    const fecha = new Date(dto.fecha_hora);

    const reserva = await this.reservaRepository.findOne({
      where: {
        fecha_hora: fecha,
        espacio: { id_espacio: dto.espacio_id },
        estado: In(['reservado', 'esperando']),
      },
      relations: ['usuario'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    const esPropia = reserva.usuario?.usuario_id === user.userId;
    const esAdmin = user.rolId === 1;

    if (esAdmin) {
      // admin puede cancelar cualquier reserva válida
    } else if (esPropia) {
      if (!['reservado', 'esperando'].includes(reserva.estado)) {
        throw new ForbiddenException('Solo puedes cancelar reservas que no estén en uso');
      }
    } else {
      throw new ForbiddenException('No tienes permisos para cancelar esta reserva');
    }

    reserva.estado = 'cancelado';
    await this.reservaRepository.save(reserva);
    this.reservasGateway.emitirNovedadReserva();

    return { message: 'Reserva cancelada exitosamente' };
  }

  async marcarReservaEnUso(
    dto: MarcarReservaEnUsoDto,
    user: { userId: number; rolId: number },
  ) {
    const fecha = new Date(dto.fecha_hora);

    if (user.rolId !== 1) {
      throw new ForbiddenException('Solo los administradores pueden usar esta función');
    }

    const reserva = await this.reservaRepository.findOne({
      where: {
        fecha_hora: fecha,
        espacio: { id_espacio: dto.espacio_id },
        estado: In(['reservado', 'esperando', 'uso_libre']),
      },
      relations: ['usuario'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva activa no encontrada');
    }

    reserva.estado = 'en_uso';
    await this.reservaRepository.save(reserva);
    this.reservasGateway.emitirNovedadReserva();

    return { message: 'Reserva marcada como en uso correctamente' };
  }

  async ponerEnUsoLibre(dto: PonerEnUsoLibreDto, user: { userId: number; rolId: number }) {
    if (user.rolId !== 1) {
      throw new ForbiddenException('Solo administradores pueden liberar reservas.');
    }

    const fecha = new Date(dto.fecha_hora);

    const reserva = await this.reservaRepository.findOne({
      where: {
        fecha_hora: fecha,
        espacio: { id_espacio: dto.espacio_id },
        estado: 'en_uso',
      },
      relations: ['usuario', 'espacio', 'deporte'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada o no está en uso');
    }

    reserva.estado = 'cancelado_antes_de_tiempo';
    await this.reservaRepository.save(reserva);

    const nuevaReserva = this.reservaRepository.create({
      fecha_hora: reserva.fecha_hora,
      espacio: reserva.espacio,
      estado: 'uso_libre',
    });

    await this.reservaRepository.save(nuevaReserva);

    this.reservasGateway.emitirNovedadReserva?.();

    return { message: 'Reserva cancelada y espacio marcado como libre exitosamente' };
  }

  async obtenerReservasActivasDeUsuario(usuarioId: number) {
    const reservas = await this.reservaRepository.find({
      where: {
        usuario: { usuario_id: usuarioId },
        estado: In(['reservado', 'en_uso', 'esperando', 'uso_libre']),
      },
      relations: ['espacio', 'deporte', 'evento'],
      order: { fecha_hora: 'ASC' },
    });

    if (!reservas.length) {
      throw new NotFoundException('No tienes reservas activas actualmente');
    }

    return reservas.map((r) => ({
      id_reserva: r.id_reserva,
      fecha_hora: r.fecha_hora,
      estado: r.estado,
      espacio: r.espacio?.espacio ?? null,
      deporte: r.deporte?.nombre ?? null,
      evento: r.evento?.nombre ?? null,
    }));
  }


}
