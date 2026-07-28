import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Correo inválido' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'Correo inválido' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString()
  @MinLength(1, { message: 'El apellido es obligatorio' })
  apellido: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password: string;

  @IsOptional()
  @IsString()
  puesto?: string;
}
