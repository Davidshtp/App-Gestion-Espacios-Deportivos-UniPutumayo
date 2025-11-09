import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
import * as Jimp from 'jimp';
import * as QrCode from 'qrcode-reader';
import * as fs from 'fs';
import * as path from 'path';

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
  ) {}

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

  private async getDeporte(
    deporteId: number | undefined,
  ): Promise<DeporteEntity | null> {
    if (!deporteId) {
      return null;
    }
    const deporte = await this.deporteRepository.findOneBy({
      id_deporte: deporteId,
    });

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
  private async getEvento(
    eventoId: number | undefined,
  ): Promise<EventoEntity | null> {
    if (!eventoId) {
      return null;
    }
    const evento = await this.eventoRepository.findOne({
      where: { id_evento: eventoId },
    });
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
        estados: [
          'reservado',
          'en_uso',
          'cancelado_antes_de_tiempo',
          'esperando',
        ],
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
      const puedeReservar = await this.puedeReservarHoy({
        usuario_id: usuario.usuario_id,
        fecha: dto.fecha_hora,
      });
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
      evento, // <-- ¡ASIGNAR EVENTO! (puede ser null)
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
      throw new InternalServerErrorException(
        'Error al cargar los datos de la reserva',
      );
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

  async cancelarReserva(
    dto: CancelarReservaDto,
    user: { userId: number; rolId: number },
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
        throw new ForbiddenException(
          'Solo puedes cancelar reservas que no estén en uso',
        );
      }
    } else {
      throw new ForbiddenException(
        'No tienes permisos para cancelar esta reserva',
      );
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
      throw new ForbiddenException(
        'Solo los administradores pueden usar esta función',
      );
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

  async ponerEnUsoLibre(
    dto: PonerEnUsoLibreDto,
    user: { userId: number; rolId: number },
  ) {
    if (user.rolId !== 1) {
      throw new ForbiddenException(
        'Solo administradores pueden liberar reservas.',
      );
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

    return {
      message: 'Reserva cancelada y espacio marcado como libre exitosamente',
    };
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

  async obtenerDiasCompletamenteReservados(idEspacio: number) {
    const horaInicio = 7;
    const horaFin = 23;
    const totalHorasDisponibles = horaFin - horaInicio;

    const reservas = await this.reservaRepository.find({
      where: {
        espacio: { id_espacio: idEspacio },
        estado: In(['reservado', 'en_uso', 'esperando', 'uso_libre']),
      },
      select: ['fecha_hora'],
    });

    if (!reservas.length) return [];

    const reservasPorDia: Record<string, number[]> = {};

    for (const r of reservas) {
      const fechaDB = r.fecha_hora as Date;
      const anio = fechaDB.getFullYear();
      const mes = fechaDB.getMonth();
      const diaNum = fechaDB.getDate();
      const horaAgrupacion = fechaDB.getHours();
      const fechaAgrupacion = new Date(anio, mes, diaNum);
      const diaAgrupacion = `${fechaAgrupacion.getFullYear()}-${String(fechaAgrupacion.getMonth() + 1).padStart(2, '0')}-${String(fechaAgrupacion.getDate()).padStart(2, '0')}`;

      if (horaAgrupacion >= horaInicio && horaAgrupacion < horaFin) {
        if (!reservasPorDia[diaAgrupacion]) reservasPorDia[diaAgrupacion] = [];
        reservasPorDia[diaAgrupacion].push(horaAgrupacion);
      }
    }

    const horasPosiblesCompletas = Array.from(
      { length: totalHorasDisponibles },
      (_, i) => i + horaInicio,
    );
    const hoy = new Date();
    const hoyISO = hoy.toISOString().split('T')[0];
    const horaActualServidor = hoy.getHours();
    const diasCompletos: string[] = [];

    for (const [fecha, horasReservadas] of Object.entries(reservasPorDia)) {
      const horasUnicasReservadas = new Set(horasReservadas);
      let horasRequeridas: number[] = [];

      if (fecha > hoyISO) {
        horasRequeridas = horasPosiblesCompletas;
      } else if (fecha === hoyISO) {
        const proximaHoraReserva = Math.max(horaActualServidor + 1, horaInicio);

        if (proximaHoraReserva >= horaFin) continue;

        horasRequeridas = horasPosiblesCompletas.filter(
          (h) => h >= proximaHoraReserva,
        );
      } else {
        continue;
      }

      if (horasRequeridas.length === 0) continue;

      const todasOcupadasRequeridas =
        horasUnicasReservadas.size === horasRequeridas.length &&
        horasRequeridas.every((h) => horasUnicasReservadas.has(h));

      if (todasOcupadasRequeridas) {
        diasCompletos.push(fecha);
      }
    }
    return diasCompletos;
  }

  async contarReservasActivasPorUsuario(idUsuario: number): Promise<number> {
    const total = await this.reservaRepository.count({
      where: {
        usuario: { usuario_id: idUsuario },
        estado: 'reservado',
      },
    });
    return total;
  }

  async obtenerHorasTotalesDeUso(
    usuarioId: number,
  ): Promise<{ totalHoras: number }> {
    try {
      const totalHoras = await this.reservaRepository.count({
        where: {
          usuario: { usuario_id: usuarioId },
          estado: 'usado',
        },
      });

      return { totalHoras };
    } catch (error) {
      console.error('Error al obtener las horas totales de uso:', error);
      throw new InternalServerErrorException(
        'No se pudieron obtener las horas totales de uso',
      );
    }
  }

  async reservarTodoElDia(
    espacioId: number,
    fecha: string, // formato "YYYY-MM-DD"
    user: { userId: number; rolId: number },
  ) {
    if (user.rolId !== 1) {
      throw new ForbiddenException(
        'Solo los administradores pueden usar esta función',
      );
    }

    const espacio = await this.getEspacio(espacioId);
    const hoy = new Date();
    const fechaBase = new Date(`${fecha}T00:00:00`);
    const esHoy = fechaBase.toDateString() === hoy.toDateString();

    const horaInicio = 7;
    const horaFin = 23;
    const horaActual = hoy.getHours();

    // ✅ Generar solo las horas válidas a reservar
    const horasAReservar: number[] = [];
    for (let h = horaInicio; h <= horaFin; h++) {
      if (esHoy && h <= horaActual) continue; // si es hoy, saltar horas pasadas
      horasAReservar.push(h);
    }

    if (!horasAReservar.length) {
      throw new BadRequestException(
        'No hay horas disponibles para reservar en esta fecha',
      );
    }

    // 1️⃣ Obtener reservas existentes del día
    const inicioDia = new Date(`${fecha}T00:00:00`);
    const finDia = new Date(`${fecha}T23:59:59`);

    const reservasExistentes = await this.reservaRepository.find({
      where: {
        espacio: { id_espacio: espacioId },
        fecha_hora: Between(inicioDia, finDia),
        estado: In(['reservado', 'en_uso', 'esperando', 'uso_libre']),
      },
      relations: ['usuario'],
    });

    // 2️⃣ Cancelar reservas existentes — ignorando las no encontradas
    for (const r of reservasExistentes) {
      try {
        await this.cancelarReserva(
          { fecha_hora: r.fecha_hora.toISOString(), espacio_id: espacioId },
          user,
        );
      } catch (err) {
        if (err instanceof NotFoundException) {
          continue;
        }
        throw err; // si es otro error, sí se lanza
      }
    }

    // 3️⃣ Crear nuevas reservas para las horas disponibles
    const nuevasReservas: {
      id: number;
      fecha: Date;
      estado: string;
      espacio: string;
      deporte: string;
      evento: string;
      usuario: { nombre: string; apellido: string };
    }[] = [];

    for (const h of horasAReservar) {
      const fechaHora = new Date(
        `${fecha}T${String(h).padStart(2, '0')}:00:00`,
      );

      try {
        const reserva = await this.crearReserva({
          usuario_id: user.userId,
          espacio_id: espacioId,
          fecha_hora: fechaHora.toISOString(),
        } as CreateReservaDto);

        nuevasReservas.push(reserva.reserva);
      } catch (err) {}
    }

    return {
      message: `Se reservaron ${nuevasReservas.length} horas para el ${fecha}`,
      reservas: nuevasReservas,
    };
  }

  async checkIn(file: Express.Multer.File, user: { userId: number }) {
    let imageBuffer: Buffer;

    // Si no llega archivo, usa la imagen estática de assets
    if (!file) {
      const qrPath = path.join(__dirname, '..', '..', 'assets', 'QR_Esp1.png');
      if (!fs.existsSync(qrPath)) {
        throw new BadRequestException(
          'La imagen QR_Esp1.png no existe en assets.',
        );
      }
      imageBuffer = fs.readFileSync(qrPath);
    } else {
      imageBuffer = file.buffer;
    }

    let espacioId: number;

    try {
      const image = await Jimp.read(imageBuffer);
      const qr = new QrCode();
      const value: any = await new Promise((resolve, reject) => {
        qr.callback = (err, v) => (err != null ? reject(err) : resolve(v));
        qr.decode(image.bitmap);
      });

      if (!value || !value.result) {
        throw new Error('QR inválido');
      }

      // Asumimos que el QR contiene el ID del espacio directamente como un número o string numérico.
      const parsedId = parseInt(value.result, 10);
      if (isNaN(parsedId)) {
        throw new BadRequestException(
          'El contenido del QR no es un ID de espacio válido.',
        );
      }
      espacioId = parsedId;
    } catch (error) {
      console.error('Error leyendo QR:', error);
      throw new BadRequestException(
        'No se pudo leer el código QR de la imagen. Asegúrate de que la imagen sea clara y válida.',
      );
    }

    if (!espacioId) {
      throw new BadRequestException(
        'El código QR no contiene un ID de espacio válido.',
      );
    }

    const ahora = new Date();

    // Buscar reservas del usuario para ese espacio que puedan hacer check-in
    const reservasPosibles = await this.reservaRepository.find({
      where: {
        usuario: { usuario_id: user.userId },
        espacio: { id_espacio: espacioId },
        estado: In(['reservado', 'esperando']),
      },
      order: {
        fecha_hora: 'ASC',
      },
    });

    if (!reservasPosibles.length) {
      throw new NotFoundException(
        'No tienes ninguna reserva pendiente para este espacio.',
      );
    }

    let reservaParaCheckIn: ReservaEntity | null = null;

    for (const reserva of reservasPosibles) {
      const horaInicioReserva = new Date(reserva.fecha_hora);
      const inicioVentanaCheckIn = new Date(
        horaInicioReserva.getTime() - 5 * 60 * 1000,
      ); // 5 minutos antes
      const finVentanaCheckIn = new Date(
        horaInicioReserva.getTime() + 20 * 60 * 1000,
      ); // 20 minutos después

      if (ahora >= inicioVentanaCheckIn && ahora <= finVentanaCheckIn) {
        reservaParaCheckIn = reserva;
        break;
      }
    }

    if (!reservaParaCheckIn) {
      throw new BadRequestException(
        'No estás en el período de tiempo para hacer check-in (desde 5 min antes hasta 20 min después de la hora de inicio).',
      );
    }

    reservaParaCheckIn.estado = 'en_uso'; // Cambiar a 'en_uso'
    await this.reservaRepository.save(reservaParaCheckIn);
    this.reservasGateway.emitirNovedadReserva();

    return { message: 'Check-in realizado con éxito. ¡A disfrutar!' };
  }
}
