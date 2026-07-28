import { Module } from '@nestjs/common';
import { MantenimientoService } from './mantenimiento.service';
import { MantenimientoController } from './mantenimiento.controller';

@Module({
  providers: [MantenimientoService],
  controllers: [MantenimientoController]
})
export class MantenimientoModule {}
