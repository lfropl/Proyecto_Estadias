import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MantenimientoService } from './mantenimiento.service';

@Controller('api/mantenimiento')
@UseGuards(JwtAuthGuard)
export class MantenimientoController {
  constructor(private readonly service: MantenimientoService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}