import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'https://stayfinder1-production.up.railway.app/api/usuario';

export interface CreateUserDTO {
  nombre: string;
  correo: string;
  telefono: string;
  fechaNacimiento: string;
  usuarioId: number;
  contrasena: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  constructor(private http: HttpClient) {}

  // Registro de usuario
  register(data: CreateUserDTO): Observable<any> {
    return this.http.post(`${API_URL}`, data);
  }
}
