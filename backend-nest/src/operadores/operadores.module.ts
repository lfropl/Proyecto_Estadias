import { Module } from '@nestjs/common';
import { OperadoresService } from './operadores.service';
import { OperadoresController } from './operadores.controller';

@Module({
  providers: [OperadoresService],
  controllers: [OperadoresController]
})
export class OperadoresModule {}