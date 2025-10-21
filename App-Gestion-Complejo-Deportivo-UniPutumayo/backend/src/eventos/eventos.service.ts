// src/eventos/eventos.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventoEntity } from './entity/evento.entity';
import { Repository } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AppGateway } from 'src/gateways/app.gateway';


@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(EventoEntity)
    private readonly eventoRepository: Repository<EventoEntity>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly eventoGateway: AppGateway
  ) { }

  async crearEvento(dto: CreateEventoDto, file?: Express.Multer.File): Promise<EventoEntity> {
    let imageUrl: string | undefined;
    if (file) {
      imageUrl = await this.cloudinaryService.uploadImage(file);
    }

    const nuevoEvento = this.eventoRepository.create({
      ...dto,
      url_imagen_evento: imageUrl,
      estado: 'activo',
    });
    const guardado = await this.eventoRepository.save(nuevoEvento);
    this.eventoGateway.emitirNovedadEvento(); // 👈 ahora sí después
    return guardado;
  }

  async listarEventos(): Promise<EventoEntity[]> {
    return await this.eventoRepository.find({
      where: { estado: 'activo' },
    });
  }

  async actualizarEvento(
    id: number,
    dto: UpdateEventoDto,
    file?: Express.Multer.File,
  ): Promise<EventoEntity> {
    const evento = await this.eventoRepository.findOne({ where: { id_evento: id } });
    if (!evento) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado.`);
    }

    if (file) {
      if (evento.url_imagen_evento) {
        await this.cloudinaryService.deleteImage(evento.url_imagen_evento);
      }
      const newImageUrl = await this.cloudinaryService.uploadImage(file);
      evento.url_imagen_evento = newImageUrl;
    } else if (dto.url_imagen_evento === '') {
      if (evento.url_imagen_evento) {
        await this.cloudinaryService.deleteImage(evento.url_imagen_evento);
      }
      evento.url_imagen_evento = null;
    }


    Object.assign(evento, dto);

    const actualizado = await this.eventoRepository.save(evento);
    this.eventoGateway.emitirNovedadEvento();
    return actualizado;
  }

  async softDeleteEvento(id: number): Promise<EventoEntity> {
    const evento = await this.eventoRepository.findOne({ where: { id_evento: id } });
    if (!evento) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado.`);
    }

    evento.estado = 'inactivo';
    if (evento.url_imagen_evento) {
      await this.cloudinaryService.deleteImage(evento.url_imagen_evento);
    }
    const eliminado = await this.eventoRepository.save(evento);
    this.eventoGateway.emitirNovedadEvento();
    return eliminado;
  }


  async contarEventosActivos(): Promise<number> {
    return await this.eventoRepository.count({ where: { estado: 'activo' } });
  }

}