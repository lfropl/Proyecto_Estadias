import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class VehiculosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vehiculo.findMany({ orderBy: { numeroEconomico: 'asc' } });
  }

  async findOne(id: string) {
    return this.prisma.vehiculo.findUnique({ where: { id } });
  }

  async create(data: {
    numeroEconomico: string;
    placas: string;
    tipo: string;
    tipoCaja?: string;
    vencimientoSeguro?: string;
    aseguradora?: string;
    polizaSeguro?: string;
    folioVerificacion?: string;
    vencimientoVerificacion?: string;
  }) {
    return this.prisma.vehiculo.create({
      data: {
        numeroEconomico: data.numeroEconomico.trim(),
        placas: data.placas.trim().toUpperCase(),
        tipo: data.tipo,
        tipoCaja: data.tipoCaja?.trim() || null,
        vencimientoSeguro: data.vencimientoSeguro?.trim() || null,
        aseguradora: data.aseguradora?.trim() || null,
        polizaSeguro: data.polizaSeguro?.trim() || null,
        folioVerificacion: data.folioVerificacion?.trim() || null,
        vencimientoVerificacion: data.vencimientoVerificacion?.trim() || null,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.vehiculo.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.vehiculo.delete({ where: { id } });
  }
}