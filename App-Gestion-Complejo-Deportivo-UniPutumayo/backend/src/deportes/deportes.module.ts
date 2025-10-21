import { Module } from '@nestjs/common';
import { DeportesService } from './deportes.service';
import { DeportesController } from './deportes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeporteEntity } from './entity/deportes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeporteEntity])],
  providers: [DeportesService],
  controllers: [DeportesController]
})
export class DeportesModule {}
