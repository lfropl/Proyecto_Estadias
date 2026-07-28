import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cliente.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: string) {
    return this.prisma.cliente.findUnique({ where: { id } });
  }

  async create(data: { nombre: string; rfc?: string; direccionFiscal?: string }) {
    return this.prisma.cliente.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.cliente.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.cliente.delete({ where: { id } });
  }
}