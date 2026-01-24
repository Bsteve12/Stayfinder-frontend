import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string; // <-- el backend devuelve sólo el token
}

export interface User {
  id?: number | null;
  nombre?: string | null;
  email?: string | null;
  role?: 'CLIENT' | 'OWNER' | 'ADMIN' | undefined;
  foto?: string | null;
  usuarioId?: number | null; // si tu token trae usuarioId
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://stayfinder1-production.up.railway.app/api/usuario';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkInitialAuth();
  }

  // -------------------------------
  // 🔐 Verificar sesión al recargar
  // -------------------------------
  private checkInitialAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      const user = this.buildUserFromToken(token);
      if (user) {
        // Guardar user en localStorage si no existe (mantenemos compatibilidad)
        if (!localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        if (!localStorage.getItem('role') && user.role) {
          localStorage.setItem('role', user.role);
        }
        this.isAuthenticatedSubject.next(true);
        this.currentUserSubject.next(user);
        return;
      } else {
        // token inválido -> limpiar
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      }
    }
    // Si no hay token válido
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  // -------------------------------
  // 🔑 Login con API real (backend devuelve sólo token)
  // -------------------------------
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        const token = response.token;
        if (!token) {
          throw new Error('No token recibido en respuesta de login');
        }

        // Guardar token en localStorage
        localStorage.setItem('token', token);

        // Decodificar token para construir user
        const user = this.buildUserFromToken(token);

        if (user) {
          // Guardar user/role en localStorage por compatibilidad con el resto del frontend
          localStorage.setItem('user', JSON.stringify(user));
          if (user.role) {
            localStorage.setItem('role', user.role);
          } else {
            localStorage.removeItem('role');
          }

          // Actualizar observables
          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(user);
        } else {
          // Si no se pudo decodificar, limpiar todo
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          this.isAuthenticatedSubject.next(false);
          this.currentUserSubject.next(null);
          throw new Error('Token recibido no contiene datos de usuario válidos');
        }
      })
    );
  }

  // -------------------------------
  // 🚪 Logout
  // -------------------------------
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);

    // navegar al login (comportamiento previo)
    this.router.navigate(['/login']);
  }

  // -------------------------------
  // 👤 Obtener usuario actual
  // -------------------------------
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // -------------------------------
  // 🔒 Verificar si está autenticado
  // -------------------------------
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // -------------------------------
  // 🎭 Obtener rol actual
  // -------------------------------
  getUserRole(): 'CLIENT' | 'OWNER' | 'ADMIN' | null {
    const user = this.getCurrentUser();
    return (user && user.role) ? user.role : null;
  }

  // -------------------------------
  // 🔄 Actualizar usuario
  // -------------------------------
  updateUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    if (user.role) localStorage.setItem('role', user.role);
    this.currentUserSubject.next(user);
  }

  // -------------------------------
  // 🧠 Decodifica JWT (payload) y construye User
  // -------------------------------
  private buildUserFromToken(token: string): User | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payloadBase64 = parts[1];
      // atob puede fallar si el servidor usa base64url -> reemplazamos
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);

      // Según tu backend GenerateToken(usuarioId, email, role)
      // busco propiedades comunes: usuarioId, email, role, nombre (opcional)
      const usuarioId = payload.usuarioId ?? payload.usuario_id ?? payload.userId ?? null;
      const email = payload.email ?? payload.sub ?? null;
      const roleRaw = (payload.role ?? payload.authorities ?? '')?.toString() ?? '';
      const role = roleRaw ? roleRaw.toUpperCase() : undefined;

      const nombre = payload.nombre ?? payload.name ?? null;

      const user: User = {
        usuarioId: usuarioId ? Number(usuarioId) : undefined,
        id: usuarioId ? Number(usuarioId) : undefined,
        email: email ?? undefined,
        nombre: nombre ?? undefined,
        role: (role === 'CLIENT' || role === 'OWNER' || role === 'ADMIN') ? (role as 'CLIENT'|'OWNER'|'ADMIN') : undefined,
        foto: undefined
      };

      // Si no hay una propiedad esencial (email o role), se puede considerar inválido,
      // pero en tu caso devolvemos usuario aunque falte nombre.
      return user;
    } catch (error) {
      console.error('❌ Error decodificando token JWT:', error);
      return null;
    }
  }
}
