import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeporteEntity } from './entity/deportes.entity';
import { Repository, Not } from 'typeorm';

@Injectable()
export class DeportesService {
  constructor(
    @InjectRepository(DeporteEntity)
    private readonly deporteRepository: Repository<DeporteEntity>,
  ) {}

  //  Obtener todos los deportes excepto "futbol sintetica"
  async obtenerDeportes(): Promise<DeporteEntity[]> {
    return this.deporteRepository.find({
      where: {
        nombre: Not('futbol sintetica'),
      },
      order: {
        nombre: 'ASC', 
      },
    });
  }
}
