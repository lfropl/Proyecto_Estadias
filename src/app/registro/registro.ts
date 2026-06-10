import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LoginService, UsuarioLocal } from '../login-service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent],
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss'],
})
export class Registro implements OnInit {
  nombre = '';
  apellido = '';
  correo = '';
  puesto = '';
  password = '';
  errorMsg = '';
  exitoMsg = '';
  registrosGuardados: UsuarioLocal[] = [];

  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.refrescarPanel();
  }

  ionViewWillEnter(): void {
    this.refrescarPanel();
  }

  guardarRegistro(): void {
    this.errorMsg = '';
    this.exitoMsg = '';
    if (
      !this.nombre.trim() ||
      !this.apellido.trim() ||
      !this.correo.trim() ||
      !this.puesto.trim() ||
      !this.password
    ) {
      this.errorMsg = 'Completa todos los campos.';
      this.cdr.markForCheck();
      return;
    }
    const resultado = this.loginService.registrarUsuario({
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      correo: this.correo.trim(),
      puesto: this.puesto.trim(),
      password: this.password,
    });
    if (!resultado.success) {
      this.errorMsg = resultado.error || 'No se pudo guardar.';
      this.cdr.markForCheck();
      return;
    }
    this.exitoMsg = 'Registro guardado localmente.';
    this.nombre = '';
    this.apellido = '';
    this.correo = '';
    this.puesto = '';
    this.password = '';
    this.refrescarPanel();
    this.cdr.markForCheck();
  }

  eliminarRegistro(id: string): void {
    this.loginService.eliminarUsuario(id);
    this.refrescarPanel();
    this.cdr.markForCheck();
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }

  private refrescarPanel(): void {
    this.registrosGuardados = this.loginService.obtenerUsuarios();
    this.cdr.markForCheck();
  }
}
