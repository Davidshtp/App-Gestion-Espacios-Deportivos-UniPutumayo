import { BadGatewayException, BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
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
  ) { this.googleClient = new OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID')); }

  async register(userData: CreateUsuarioDto) {

    //verificamos si la identificacion ya existe en la base de datos
    const user = await this.usuarioRepository.findOne({ where: { identificacion: userData.identificacion } })

    if (user) {
      throw new BadRequestException("Ya existe este usuario registrado")
    }

    //verificamos si el rol existe
    const rol = await this.rolRepository.findOne({ where: { id_rol: userData.rolId } })

    if (!rol) {
      throw new BadRequestException('El rol especifado no existe');
    }


    //Generar un salt para mejorar la seguridad del hash de la contraseña
    const salt = await bcrypt.genSalt(10);

    //Hashea la contraseña del usuario con el salt generado
    const hashedPassword = await bcrypt.hash(userData.contrasena, salt)

    // Generar avatar con iniciales del usuario
    const iniciales = `${userData.nombre.charAt(0)}${userData.apellido.charAt(0)}`.toUpperCase();
    
    // Generar color basado en las iniciales
    const colors = ['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', '06b6d4', 'f97316', '84cc16', 'ec4899', '6366f1', '14b8a6', 'f472b6'];
    let hash = 0;
    for (let i = 0; i < iniciales.length; i++) {
      hash = iniciales.charCodeAt(i) + ((hash << 5) - hash);
    }
    const backgroundColor = colors[Math.abs(hash) % colors.length];
    
    // Generar URL del avatar
    const avatarUrl = `https://ui-avatars.com/api/?name=${iniciales}&background=${backgroundColor}&color=fff&size=200&font-size=0.6&bold=true`;

    const newUser = this.usuarioRepository.create({
      ...userData,
      contrasena: hashedPassword,
      urlimage: avatarUrl,
      rol
    })

    await this.usuarioRepository.save(newUser)//guardamos el usuario en la base de datos
    return {
      message: 'Usuario registrado exitosamente',
    }
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
      throw new UnauthorizedException('Solo se aceptan correos institucionales (@itp.edu.co)');
    }

    let user = await this.usuarioRepository.findOne({
      where: { correo: email },
      relations: ['rol'],
    });

    if (!user) {
      // Obtener el rol completo desde la base de datos
      const rol = await this.rolRepository.findOne({ where: { id_rol: 2 } });
      if (!rol) {
        throw new BadRequestException('El rol de usuario no existe');
      }

      user = this.usuarioRepository.create({
        nombre: payload.given_name,
        apellido: payload.family_name,
        correo: email,
        contrasena: '',
        identificacion: '',
        urlimage: payload.picture,
        rol: rol,
      });
      await this.usuarioRepository.save(user);

      // Recargar el usuario con las relaciones completas
      user = await this.usuarioRepository.findOne({
        where: { correo: email },
        relations: ['rol'],
      });

      if (!user) {
        throw new BadRequestException('Error al crear el usuario');
      }
    }

    // Validar que el usuario y el rol existan
    if (!user || !user.rol) {
      throw new BadRequestException('Usuario o rol no encontrado');
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
    const user = await this.usuarioRepository.findOne({ where: { identificacion: identificacion }, relations: ['rol'] })

    //Verifcamos si el usuario existe y la contraseña proporcionada coincide con la de la base de datos
    if (user && await bcrypt.compare(password, user.contrasena)) {
      //Excluye la contraseña del objeto retornado para brindar mayor seguridad
      const { contrasena, ...result } = user;
      return result //Retorna el usuario autenticado sin la contraseña
    }
    return null //Retorna null si las credenciales no coinciden
  }

  async login(userData: LoginDto, response: Response) {
    const user = await this.validateUser(userData.identificacion, userData.contrasena);
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

  async updateEmail(userId: number, correo: string) {
    // Verificar que el usuario exista
    const user = await this.usuarioRepository.findOne({
      where: { usuario_id: userId }
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar si el usuario ya tiene un correo asignado
    if (user.correo && user.correo.trim() !== '') {
      throw new BadRequestException('El correo electrónico no se puede modificar una vez asignado');
    }

    // Verificar que el correo no esté en uso por otro usuario
    const existingUser = await this.usuarioRepository.findOne({
      where: { correo: correo }
    });

    if (existingUser && existingUser.usuario_id !== userId) {
      throw new BadRequestException('Este correo electrónico ya está en uso');
    }

    // Actualizar el correo del usuario
    await this.usuarioRepository.update(userId, { correo: correo });

    return {
      message: 'Correo electrónico actualizado exitosamente',
    };
  }

}
