import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RolEntity } from 'src/rol/entity/rol.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UserEntity } from 'src/user/entity/user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserEntity)
    private usuarioRepository: Repository<UserEntity>,
    @InjectRepository(RolEntity)
    private rolRepository: Repository<RolEntity>,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
    );
  }

  async register(userData: CreateUsuarioDto) {
    //verificamos si la identificacion ya existe en la base de datos
    const user = await this.usuarioRepository.findOne({
      where: { identificacion: userData.identificacion },
    });

    if (user) {
      throw new BadRequestException('Ya existe este usuario registrado');
    }

    //verificamos si el rol existe
    const rol = await this.rolRepository.findOne({
      where: { id_rol: userData.rolId },
    });

    if (!rol) {
      throw new BadRequestException('El rol especifado no existe');
    }

    //Generar un salt para mejorar la seguridad del hash de la contraseña
    const salt = await bcrypt.genSalt(10);

    //Hashea la contraseña del usuario con el salt generado
    const hashedPassword = await bcrypt.hash(userData.contrasena, salt);

    const newUser = this.usuarioRepository.create({
      ...userData,
      contrasena: hashedPassword,
      rol,
    });

    await this.usuarioRepository.save(newUser); //guardamos el usuario en la base de datos
    return {
      message: 'Usuario registrado exitosamente',
    };
  }

  async loginWithGoogle(credential: string, response: Response) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: this.configService.get('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email_verified || !payload.email) {
      throw new UnauthorizedException('Correo no verificado');
    }

    const email = payload.email;
    if (!email.endsWith('@itp.edu.co')) {
      response.clearCookie('auth_token');
      throw new UnauthorizedException(
        'Solo se aceptan correos institucionales (@itp.edu.co)',
      );
    }

    let user = await this.usuarioRepository.findOne({
      where: { correo: email },
      relations: ['rol'],
    });

    if (!user) {
      user = this.usuarioRepository.create({
        nombre: payload.given_name,
        apellido: payload.family_name,
        correo: email,
        contrasena: '',
        identificacion: '',
        urlimage: payload.picture,
        rol: { id_rol: 2 } as RolEntity,
      });
      await this.usuarioRepository.save(user);
    }

    const tokenPayload = {
      nombre: user.nombre,
      sub: user.usuario_id,
      rolId: user.rol.id_rol,
      role: user.rol.rol.toLowerCase(),
      correo: user.correo,
      identificacion: user.identificacion,
    };

    const token = this.jwtService.sign(tokenPayload);

    response.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 4,
    });

    return { message: 'Inicio de sesión con Google exitoso' };
  }

  async validateUser(identificacion: string, password: string): Promise<any> {
    //Buscar un usuario en la base de datos por nombre y obtenemos el rol
    const user = await this.usuarioRepository.findOne({
      where: { identificacion: identificacion },
      relations: ['rol'],
    });

    //Verifcamos si el usuario existe y la contraseña proporcionada coincide con la de la base de datos
    if (user && (await bcrypt.compare(password, user.contrasena))) {
      //Excluye la contraseña del objeto retornado para brindar mayor seguridad
      const { contrasena, ...result } = user;
      return result; //Retorna el usuario autenticado sin la contraseña
    }
    return null; //Retorna null si las credenciales no coinciden
  }

  async login(userData: LoginDto, response: Response) {
    const user = await this.validateUser(
      userData.identificacion,
      userData.contrasena,
    );
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    const tokenPayload = {
      nombre: user.nombre,
      sub: user.usuario_id,
      rolId: user.rol.id_rol,
      role: user.rol.rol.toLowerCase(),
      correo: user.correo,
      identificacion: user.identificacion,
    };

    const token = this.jwtService.sign(tokenPayload);

    // Enviar token en cookie segura
    response.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 4,
    });

    return { message: 'Inicio de sesión exitoso' };
  }

  async getProfile(userId: number) {
    const user = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['rol'],
    });

    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const { contrasena, ...rest } = user;
    return rest;
  }
}
