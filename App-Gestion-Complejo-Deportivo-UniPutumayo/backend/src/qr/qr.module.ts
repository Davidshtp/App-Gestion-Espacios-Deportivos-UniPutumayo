import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QrService } from "./qr.service";
import { QrController } from "./qr.controller";
import { ReservaEntity } from "src/reservas/entity/reservas.entity";
import { AppGateway } from "src/gateways/app.gateway";
import { ConfigModule } from "src/config/config.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReservaEntity]),
    ConfigModule,
  ],
  providers: [QrService, AppGateway],
  controllers: [QrController],
  exports: [QrService],
})
export class QrModule {}
