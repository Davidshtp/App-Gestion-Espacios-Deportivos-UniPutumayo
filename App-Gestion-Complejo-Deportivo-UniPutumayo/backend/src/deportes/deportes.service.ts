import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeporteEntity } from './entity/deportes.entity';
import { Repository, Not } from 'typeorm';
import { CreateDeporteDto } from './dto/create-deporte.dto';
import { UpdateDeporteDto } from './dto/update-deporte.dto';

@Injectable()
export class DeportesService {
  constructor(
    @InjectRepository(DeporteEntity)
    private readonly deporteRepository: Repository<DeporteEntity>,
  ) { }

  // Obtener todos los deportes
  async obtenerDeportes(): Promise<DeporteEntity[]> {
    return this.deporteRepository.find({
      order: {
        nombre: 'ASC',
      },
    });
  }

  async obtenerDeporte(id: number): Promise<DeporteEntity> {
    const deporte = await this.deporteRepository.findOneBy({ id_deporte: id });
    if (!deporte) throw new NotFoundException('Deporte no encontrado');
    return deporte;
  }

  async crearDeporte(dto: CreateDeporteDto): Promise<DeporteEntity> {
    const existe = await this.deporteRepository.findOne({ where: { nombre: dto.nombre } });
    if (existe) throw new BadRequestException('Ya existe un deporte con ese nombre');

    const nuevo = this.deporteRepository.create(dto);
    return this.deporteRepository.save(nuevo);
  }

  async actualizarDeporte(id: number, dto: UpdateDeporteDto): Promise<DeporteEntity> {
    const deporte = await this.obtenerDeporte(id);
    if (dto.nombre) deporte.nombre = dto.nombre;
    return this.deporteRepository.save(deporte);
  }

  async eliminarDeporte(id: number): Promise<{ message: string }> {
    const deporte = await this.obtenerDeporte(id);
    await this.deporteRepository.remove(deporte);
    return { message: 'Deporte eliminado exitosamente' };
  }
}
