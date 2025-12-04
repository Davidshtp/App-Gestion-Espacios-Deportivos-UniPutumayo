import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionEntity } from './entity/config.entity';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConfiguracionEntity])],
  providers: [ConfigService],
  controllers: [ConfigController],
  exports: [ConfigService], // Exportar para que otros módulos lo usen
})
export class ConfigModule {}
