// src/espacio/espacio.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EspacioEntity } from './entity/espacio.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateEspacioDto } from './dto/create-espacio.dto';
import { UpdateEspacioDto } from './dto/update-espacio.dto';
import { DeporteEntity } from 'src/deportes/entity/deportes.entity';

@Injectable()
export class EspacioService {
  constructor(
    @InjectRepository(EspacioEntity)
    private readonly espacioRepository: Repository<EspacioEntity>,
    @InjectRepository(DeporteEntity)
    private readonly deporteRepository: Repository<DeporteEntity>,

    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async obtenerDeportesDeEspacio(id: number) {
    const espacio = await this.espacioRepository.findOne({
      where: { id_espacio: id },
      relations: ['deportes'],
    });

    if (!espacio) {
      throw new NotFoundException(`No se encontró el espacio con id ${id}`);
    }

    return espacio.deportes;
  }

  // Crear un nuevo espacio con imagen
  async crearEspacio(dto: CreateEspacioDto, file: Express.Multer.File): Promise<EspacioEntity> {
    if (!file) throw new BadRequestException('La imagen es obligatoria');

    const imagenUrl = await this.cloudinaryService.uploadImage(file);

    const nuevoEspacio = this.espacioRepository.create({
      espacio: dto.espacio,
      imagen_url: imagenUrl,
    });

    // Asociar deportes si vienen
    if (dto.deportes && dto.deportes.length > 0) {
      const deportes = await this.deporteRepository.findBy({
        id_deporte: In(dto.deportes),
      });
      nuevoEspacio.deportes = deportes;
    }

    return await this.espacioRepository.save(nuevoEspacio);
  }

  // Obtener todos los espacios
  async obtenerTodos(): Promise<EspacioEntity[]> {
    return await this.espacioRepository.find();
  }

  // Obtener un espacio por su ID
  async obtenerPorId(id_espacio: number): Promise<EspacioEntity> {
    const espacio = await this.espacioRepository.findOne({ where: { id_espacio } });
    if (!espacio) {
      throw new NotFoundException(`No se encontró el espacio con id ${id_espacio}`);
    }
    return espacio;
  }

  // Actualizar un espacio (opcionalmente con imagen)
  async actualizarEspacio(id: number, dto: UpdateEspacioDto, file?: Express.Multer.File): Promise<EspacioEntity> {
    const espacio = await this.obtenerPorId(id);

    if (dto.espacio) espacio.espacio = dto.espacio;

    if (file) {
      const imagenUrl = await this.cloudinaryService.uploadImage(file);
      espacio.imagen_url = imagenUrl;
    }

    // Actualizar deportes
    if (dto.deportes) {
      const deportes = await this.deporteRepository.findBy({
        id_deporte: In(dto.deportes),
      });
      espacio.deportes = deportes;
    } else {
      espacio.deportes = [];
    }

    return await this.espacioRepository.save(espacio);
  }

  // Eliminar un espacio (soft delete)
  async eliminarEspacio(id: number): Promise<void> {
    const espacio = await this.obtenerPorId(id);
    await this.espacioRepository.remove(espacio);
  }
}
