import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { QrService } from "./qr.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";

@Controller("qr")
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles("admin")
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post("validar")
  async validarQr(
    @Body("reservaId") reservaId: number,
    @Body("token") token: string,
  ) {
    return this.qrService.validarQr(reservaId, token);
  }
}
