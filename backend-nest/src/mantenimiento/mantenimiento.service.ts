import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MantenimientoService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.mantenimiento.findMany({
      orderBy: { fecha: 'desc' },
      include: { vehiculo: true },
    });
  }

  async create(data: { fecha: string; descripcion: string; costo: number; vehiculoId: string }) {
    return this.prisma.mantenimiento.create({ data });
  }

  async remove(id: string) {
    return this.prisma.mantenimiento.delete({ where: { id } });
  }
}