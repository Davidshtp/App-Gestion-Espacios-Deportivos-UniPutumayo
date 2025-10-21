import { Module } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { EventosController } from './eventos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoEntity } from './entity/evento.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { GatewaysModule } from 'src/gateways/gateways.module';



@Module({
  imports: [TypeOrmModule.forFeature([EventoEntity]),
  CloudinaryModule,GatewaysModule
],
  providers: [EventosService],
  controllers: [EventosController]
})
export class EventosModule {}
