// auth.controller.ts
import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards, } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  async register(@Body() user: CreateUsuarioDto) {
    return this.authService.register(user);
  }

  @Post('login')
  async login(
    @Body() user: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(user, res);
  }

  @Post('google-login')
  async googleLogin(@Body() body: { credential: string }, @Res({ passthrough: true }) res: Response) {
    const { credential } = body;
    if (!credential) throw new BadRequestException('Token de Google no proporcionado');

    const token = await this.authService.loginWithGoogle(credential, res);

    return { message: 'Inicio de sesión con Google exitoso', token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    return this.authService.getProfile(req['user'].userId);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token');
    return { message: 'Sesión cerrada correctamente' };
  }
}
