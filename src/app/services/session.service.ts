import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SessionToken {
  token: string;
  expiresAt: number;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly SESSION_KEY = 'session_token_estadias';
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutos
  private sessionToken$ = new BehaviorSubject<SessionToken | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadSessionFromStorage();
    }
  }

  createSession(userId: string): SessionToken {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Session creation only available in browser');
    }

    const token = this.generateToken();
    const expiresAt = Date.now() + this.SESSION_TIMEOUT;

    const sessionToken: SessionToken = {
      token,
      expiresAt,
      userId,
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionToken));
    this.sessionToken$.next(sessionToken);

    return sessionToken;
  }

  getSessionToken(): SessionToken | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return this.sessionToken$.value;
  }

  getSessionToken$(): Observable<SessionToken | null> {
    return this.sessionToken$.asObservable();
  }

  isSessionValid(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const session = this.sessionToken$.value;
    if (!session) return false;

    const isExpired = Date.now() > session.expiresAt;
    if (isExpired) {
      this.destroySession();
      return false;
    }

    return true;
  }

  refreshSession(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const session = this.sessionToken$.value;
    if (session) {
      session.expiresAt = Date.now() + this.SESSION_TIMEOUT;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      this.sessionToken$.next(session);
    }
  }

  destroySession(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.removeItem(this.SESSION_KEY);
    this.sessionToken$.next(null);
  }

  private loadSessionFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw) as SessionToken;
        if (this.isSessionNotExpired(session)) {
          this.sessionToken$.next(session);
        } else {
          this.destroySession();
        }
      }
    } catch {
      this.destroySession();
    }
  }

  private isSessionNotExpired(session: SessionToken): boolean {
    return Date.now() <= session.expiresAt;
  }

  private generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
