import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!usuario) throw new UnauthorizedException('Correo o contraseña incorrectos.');
    if (!usuario.activo) throw new UnauthorizedException('Usuario desactivado.');

    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) throw new UnauthorizedException('Correo o contraseña incorrectos.');

    const payload = { sub: usuario.id, email: usuario.email, puesto: usuario.puesto };
    const token = this.jwtService.sign(payload);

    const { password: _, ...usuarioSinPassword } = usuario;
    return { ...usuarioSinPassword, token };
  }

  async register(email: string, password: string, nombre: string, apellido: string, puesto?: string) {
    const emailLimpio = email.toLowerCase().trim();
    const existe = await this.prisma.usuario.findUnique({ where: { email: emailLimpio } });
    if (existe) throw new UnauthorizedException('Ese correo ya está registrado.');

    const hashed = await bcrypt.hash(password, 12);
    const usuario = await this.prisma.usuario.create({
      data: {
        email: emailLimpio,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        password: hashed,
        puesto: puesto?.trim() || 'Usuario',
        activo: true,
      },
    });

    const payload = { sub: usuario.id, email: usuario.email, puesto: usuario.puesto };
    const token = this.jwtService.sign(payload);

    const { password: _, ...usuarioSinPassword } = usuario;
    return { ...usuarioSinPassword, token };
  }

  async countUsers(): Promise<number> {
    return this.prisma.usuario.count();
  }
}