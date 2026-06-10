import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../login-service';
import { ActivityDetector } from '../services/activity.detector';
import { InactivityService } from '../services/inactivity.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly inactivityService = inject(InactivityService);
  private readonly activityDetector = inject(ActivityDetector);

  submit(): void {
    const ok = this.loginService.login(this.username, this.password);
    this.errorMessage = this.loginService.authError$.value;
    this.cdr.markForCheck();
    if (ok) {
      this.inactivityService.startInactivityTimer();
      this.activityDetector.detectUserActivity();
      this.router.navigate(['/vista-general']);
    }
  }
}
