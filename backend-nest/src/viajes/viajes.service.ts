import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ViajesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.viaje.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        seguimientos: true,
        comentarios: true,
        archivos: true,
        facturaDatos: true,
        cobranzaPago: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.viaje.findUnique({
      where: { id },
      include: {
        seguimientos: true,
        comentarios: true,
        archivos: true,
        facturaDatos: true,
        cobranzaPago: true,
      },
    });
  }

  async create(data: any) {
    const { seguimientos, comentarios, archivos, facturaDatos, cobranzaPago, ...viajeData } = data;
    return this.prisma.viaje.create({
      data: {
        ...viajeData,
        seguimientos: seguimientos ? { create: seguimientos } : undefined,
        comentarios: comentarios ? { create: comentarios } : undefined,
        archivos: archivos ? { create: archivos } : undefined,
        facturaDatos: facturaDatos ? { create: facturaDatos } : undefined,
        cobranzaPago: cobranzaPago ? { create: cobranzaPago } : undefined,
      },
    });
  }

  async update(id: string, data: any) {
    const { seguimientos, comentarios, archivos, facturaDatos, cobranzaPago, ...viajeData } = data;

    if (seguimientos) {
      await this.prisma.recoleccionSeguimiento.deleteMany({ where: { viajeId: id } });
      await this.prisma.recoleccionSeguimiento.createMany({ data: seguimientos.map(s => ({ ...s, viajeId: id })) });
    }

    return this.prisma.viaje.update({
      where: { id },
      data: viajeData,
    });
  }

  async remove(id: string) {
    return this.prisma.viaje.delete({ where: { id } });
  }
}