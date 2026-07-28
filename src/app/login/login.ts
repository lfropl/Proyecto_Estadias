import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../login-service';
import { ActivityDetector } from '../services/activity.detector';
import { InactivityService } from '../services/inactivity.service';
import { apiFetch } from '../api-helper';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage = '';
  guardando = false;
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly inactivityService = inject(InactivityService);
  private readonly activityDetector = inject(ActivityDetector);

  async ngOnInit() {
    try {
      const res = await apiFetch('/auth/has-users');
      const data = await res.json();
      if (!data.hasUsers) {
        this.router.navigate(['/setup']);
      }
    } catch {
      // Si no hay backend, no hacer nada
    }
  }

  async submit(): Promise<void> {
    if (this.guardando) return;
    this.guardando = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    try {
      const ok = await this.loginService.login(this.username, this.password);
      this.errorMessage = this.loginService.authError$.value;
      this.cdr.markForCheck();
      if (ok) {
        this.inactivityService.startInactivityTimer();
        this.activityDetector.detectUserActivity();
        this.router.navigate(['/vista-general']);
      }
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }
}
