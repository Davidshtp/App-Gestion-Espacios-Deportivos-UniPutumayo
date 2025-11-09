import { Module } from '@nestjs/common';
import { EspacioController } from './espacio.controller';
import { EspacioService } from './espacio.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspacioEntity } from './entity/espacio.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { DeporteEntity } from 'src/deportes/entity/deportes.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EspacioEntity, DeporteEntity]),
    CloudinaryModule,
  ],
  controllers: [EspacioController],
  providers: [EspacioService],
})
export class EspacioModule {}
