// reservas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservaEntity } from './entity/reservas.entity';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';
import { UserEntity } from 'src/user/entity/user.entity';
import { EspacioEntity } from 'src/espacio/entity/espacio.entity';
import { GatewaysModule } from 'src/gateways/gateways.module';
import { DeporteEntity } from 'src/deportes/entity/deportes.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { ReservaCronService } from './reserva-cron.service';
import { EventoEntity } from 'src/eventos/entity/evento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReservaEntity, UserEntity, EspacioEntity, DeporteEntity,EventoEntity]),
    ScheduleModule,GatewaysModule
  ],
  controllers: [ReservasController],
  providers: [ReservasService,ReservaCronService],
})
export class ReservasModule { }
