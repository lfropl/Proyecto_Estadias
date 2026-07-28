import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { OperadoresModule } from './operadores/operadores.module';
import { ClientesModule } from './clientes/clientes.module';
import { MantenimientoModule } from './mantenimiento/mantenimiento.module';
import { ViajesModule } from './viajes/viajes.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosController } from './usuarios/usuarios.controller';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    VehiculosModule,
    OperadoresModule,
    ClientesModule,
    MantenimientoModule,
    ViajesModule,
  ],
  controllers: [AppController, UsuariosController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}