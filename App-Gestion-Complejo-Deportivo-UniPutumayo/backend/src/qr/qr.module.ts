import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QrService } from "./qr.service";
import { QrController } from "./qr.controller";
import { ReservaEntity } from "src/reservas/entity/reservas.entity";
import { AppGateway } from "src/gateways/app.gateway";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReservaEntity]),
  ],
  providers: [QrService, AppGateway],
  controllers: [QrController],
  exports: [QrService],
})
export class QrModule {}
