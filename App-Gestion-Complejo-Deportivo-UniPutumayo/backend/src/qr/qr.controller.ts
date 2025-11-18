import { Controller, Post, Body } from "@nestjs/common";
import { QrService } from "./qr.service";

@Controller("qr")
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post("validar")
  async validarQr(
    @Body("reservaId") reservaId: number,
    @Body("token") token: string,
  ) {
    return this.qrService.validarQr(reservaId, token);
  }

  @Post("generar")
  async generarParaReserva(@Body("reservaId") reservaId: number) {
    return this.qrService.generarQrParaReserva(reservaId);
  }
}
