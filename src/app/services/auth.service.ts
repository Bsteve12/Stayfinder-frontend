import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
}

export interface User {
  id?: number | null;
  nombre?: string | null;
  email?: string | null;
  role?: 'CLIENT' | 'OWNER' | 'ADMIN' | undefined;
  usuarioId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // ✅ URL CORRECTA DEL BACKEND
  private apiUrl = 'https://stayfinder-backend-86433570710.us-central1.run.app/api/usuario';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkInitialAuth();
  }

  private checkInitialAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      const user = this.buildUserFromToken(token);
      if (user) {
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(user);
        return;
      }
    }
    this.logout();
  }

  // ✅ LOGIN CORRECTO
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          const user = this.buildUserFromToken(response.token);
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            if (user.role) localStorage.setItem('role', user.role);
            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(user);
          }
        }
      })
    );
  }

  // ✅ REGISTRO CORRECTO
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, userData);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private buildUserFromToken(token: string): User | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;

      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      return {
        usuarioId: payload.usuarioId || null,
        id: payload.usuarioId || null,
        email: payload.sub || null,
        role: payload.rol ? payload.rol.toUpperCase() : undefined
      };
    } catch (e) {
      return null;
    }
  }
}
