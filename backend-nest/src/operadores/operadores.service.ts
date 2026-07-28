import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class OperadoresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.operador.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: string) {
    return this.prisma.operador.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.operador.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.operador.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.operador.delete({ where: { id } });
  }
}