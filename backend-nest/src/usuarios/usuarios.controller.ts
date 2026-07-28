import { Controller, Get, Delete, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('api/usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.usuario.findMany({
      select: { id: true, email: true, nombre: true, apellido: true, puesto: true, activo: true, createdAt: true }
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { email?: string; nombre?: string; apellido?: string; puesto?: string; password?: string }) {
    const data: any = {};
    if (body.email) data.email = body.email.trim().toLowerCase();
    if (body.nombre) data.nombre = body.nombre.trim();
    if (body.apellido) data.apellido = body.apellido.trim();
    if (body.puesto) data.puesto = body.puesto.trim();
    if (body.password) data.password = await bcrypt.hash(body.password, 12);
    return this.prisma.usuario.update({ where: { id }, data, select: { id: true, email: true, nombre: true, apellido: true, puesto: true } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.usuario.delete({ where: { id } });
  }
}
