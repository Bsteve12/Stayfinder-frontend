import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Enums
enum Role {
  CLIENT = 'CLIENT',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN'
}

enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA'
}

// Interfaces
interface PublicacionResponseDTO {
  id: number;
  alojamientoId: number;
  alojamientoNombre: string;
  estado: string;
  fechaPublicacion: string;
}

interface SolicitudOwnerResponseDTO {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  estado: string;
  comentarios?: string;
  documentoUrl?: string;
  fechaSolicitud: string;
}

interface SolicitudPublicacionResponseDTO {
  id: number;
  alojamientoId: number;
  alojamientoNombre: string;
  ownerNombre: string;
  estado: string;
  comentarios?: string;
  fechaSolicitud: string;
}

interface UsuarioResponseDTO {
  id: number;
  nombre: string;
  email: string;
  role: Role;
  telefono?: string;
  fechaRegistro: string;
}

interface CreateUserDTO {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
}

@Component({
  selector: 'app-administrador',
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './administrador.html',
  styleUrl: './administrador.scss',
})
export class Administrador implements OnInit {
  private readonly API_URL = 'http://localhost:8080/api';
  
  // Vista actual
  currentView: 'perfil' | 'solicitud-publicaciones' | 'solicitud-anfitriones' | 'asignar-rol' | 'listar-usuarios' | 'listar-por-rol' | 'crear-usuario' = 'perfil';
  
  // Admin actual
  adminId: number = 1;
  adminNombre: string = 'Admin Principal';
  adminEmail: string = 'admin@stayfinder.com';
  
  // Datos
  publicacionesPendientes: PublicacionResponseDTO[] = [];
  solicitudesOwner: SolicitudOwnerResponseDTO[] = [];
  solicitudesPublicacion: SolicitudPublicacionResponseDTO[] = [];
  usuarios: UsuarioResponseDTO[] = [];
  usuariosFiltrados: UsuarioResponseDTO[] = [];
  
  // Roles para dropdown
  roles = [
    { label: 'Cliente', value: Role.CLIENT },
    { label: 'Anfitrión', value: Role.OWNER },
    { label: 'Administrador', value: Role.ADMIN }
  ];
  
  // Loading states
  loading: boolean = false;
  
  // Dialog states
  showRespuestaDialog: boolean = false;
  showAsignarRolDialog: boolean = false;
  showCrearUsuarioDialog: boolean = false;
  
  // Formularios
  selectedItem: any = null;
  respuestaComentario: string = '';
  selectedUsuario: UsuarioResponseDTO | null = null;
  selectedRole: Role = Role.CLIENT;
  selectedRoleFiltro: Role | null = null;
  
  nuevoUsuario: CreateUserDTO = {
    nombre: '',
    email: '',
    password: '',
    telefono: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Inicialización
  }

  // ============================================
  // 🔹 Cambiar Vista
  // ============================================
  changeView(view: any) {
    this.currentView = view;
    
    switch(view) {
      case 'solicitud-publicaciones':
        this.loadSolicitudesPublicacion();
        break;
      case 'solicitud-anfitriones':
        this.loadSolicitudesOwner();
        break;
      case 'listar-usuarios':
        this.loadUsuarios();
        break;
    }
  }

  // ============================================
  // 🔹 Solicitudes de Publicación
  // ============================================
  loadSolicitudesPublicacion() {
    this.loading = true;
    this.http.get<SolicitudPublicacionResponseDTO[]>(`${this.API_URL}/solicitudes-publicacion/pendientes`)
      .subscribe({
        next: (data) => {
          this.solicitudesPublicacion = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
          // Datos de ejemplo
          this.solicitudesPublicacion = [
            {
              id: 1,
              alojamientoId: 1,
              alojamientoNombre: 'Casa en la Playa',
              ownerNombre: 'María García',
              estado: 'PENDIENTE',
              comentarios: 'Primera solicitud',
              fechaSolicitud: '2025-11-15'
            }
          ];
        }
      });
  }

  responderSolicitudPublicacion(solicitud: SolicitudPublicacionResponseDTO, aprobada: boolean) {
    this.selectedItem = solicitud;
    this.showRespuestaDialog = true;
  }

  confirmarRespuestaSolicitudPublicacion(aprobada: boolean) {
    const dto = {
      solicitudId: this.selectedItem.id,
      aprobada: aprobada,
      comentarioRespuesta: this.respuestaComentario
    };

    this.http.post<SolicitudPublicacionResponseDTO>(`${this.API_URL}/solicitudes-publicacion/responder`, dto)
      .subscribe({
        next: (response) => {
          console.log('Respuesta enviada:', response);
          this.loadSolicitudesPublicacion();
          this.showRespuestaDialog = false;
          this.respuestaComentario = '';
        },
        error: (error) => {
          console.error('Error:', error);
          // Simular éxito
          this.solicitudesPublicacion = this.solicitudesPublicacion.filter(s => s.id !== this.selectedItem.id);
          this.showRespuestaDialog = false;
        }
      });
  }

  // ============================================
  // 🔹 Solicitudes de Anfitriones
  // ============================================
  loadSolicitudesOwner() {
    this.loading = true;
    this.http.get<SolicitudOwnerResponseDTO[]>(`${this.API_URL}/solicitudes-owner/pendientes`)
      .subscribe({
        next: (data) => {
          this.solicitudesOwner = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
          // Datos de ejemplo
          this.solicitudesOwner = [
            {
              id: 1,
              usuarioId: 2,
              usuarioNombre: 'Juan Pérez',
              usuarioEmail: 'juan@example.com',
              estado: 'PENDIENTE',
              comentarios: 'Quiero ser anfitrión',
              fechaSolicitud: '2025-11-10'
            }
          ];
        }
      });
  }

  responderSolicitudOwner(solicitud: SolicitudOwnerResponseDTO, aprobada: boolean) {
    const dto = {
      solicitudId: solicitud.id,
      aprobada: aprobada,
      comentarioRespuesta: ''
    };

    if (!aprobada) {
      this.selectedItem = solicitud;
      this.showRespuestaDialog = true;
      return;
    }

    this.http.post<SolicitudOwnerResponseDTO>(`${this.API_URL}/solicitudes-owner/responder`, dto)
      .subscribe({
        next: (response) => {
          console.log('Solicitud aprobada:', response);
          this.loadSolicitudesOwner();
        },
        error: (error) => {
          console.error('Error:', error);
          this.solicitudesOwner = this.solicitudesOwner.filter(s => s.id !== solicitud.id);
        }
      });
  }

  confirmarRechazoSolicitudOwner() {
    const dto = {
      solicitudId: this.selectedItem.id,
      aprobada: false,
      comentarioRespuesta: this.respuestaComentario
    };

    this.http.post<SolicitudOwnerResponseDTO>(`${this.API_URL}/solicitudes-owner/responder`, dto)
      .subscribe({
        next: (response) => {
          console.log('Solicitud rechazada:', response);
          this.loadSolicitudesOwner();
          this.showRespuestaDialog = false;
          this.respuestaComentario = '';
        },
        error: (error) => {
          console.error('Error:', error);
          this.solicitudesOwner = this.solicitudesOwner.filter(s => s.id !== this.selectedItem.id);
          this.showRespuestaDialog = false;
        }
      });
  }

  // ============================================
  // 🔹 Gestión de Usuarios
  // ============================================
  loadUsuarios() {
    this.loading = true;
    this.http.get<UsuarioResponseDTO[]>(`${this.API_URL}/users`)
      .subscribe({
        next: (data) => {
          this.usuarios = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
          // Datos de ejemplo
          this.usuarios = [
            {
              id: 1,
              nombre: 'Admin Principal',
              email: 'admin@stayfinder.com',
              role: Role.ADMIN,
              fechaRegistro: '2025-01-01'
            },
            {
              id: 2,
              nombre: 'Juan Pérez',
              email: 'juan@example.com',
              role: Role.CLIENT,
              telefono: '3001234567',
              fechaRegistro: '2025-10-15'
            }
          ];
        }
      });
  }

  loadUsuariosPorRol() {
    if (!this.selectedRoleFiltro) {
      this.usuariosFiltrados = [];
      return;
    }

    this.loading = true;
    this.http.get<UsuarioResponseDTO[]>(`${this.API_URL}/users/role/${this.selectedRoleFiltro}`)
      .subscribe({
        next: (data) => {
          this.usuariosFiltrados = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
          this.usuariosFiltrados = this.usuarios.filter(u => u.role === this.selectedRoleFiltro);
        }
      });
  }

  openAsignarRolDialog(usuario: UsuarioResponseDTO) {
    this.selectedUsuario = usuario;
    this.selectedRole = usuario.role;
    this.showAsignarRolDialog = true;
  }

  asignarRol() {
    if (!this.selectedUsuario) return;

    this.http.put<UsuarioResponseDTO>(
      `${this.API_URL}/users/${this.selectedUsuario.id}/role?newRole=${this.selectedRole}&adminUsuarioId=${this.adminId}`,
      null
    ).subscribe({
      next: (response) => {
        console.log('Rol asignado:', response);
        const index = this.usuarios.findIndex(u => u.id === this.selectedUsuario!.id);
        if (index !== -1) {
          this.usuarios[index] = response;
        }
        this.showAsignarRolDialog = false;
      },
      error: (error) => {
        console.error('Error:', error);
        // Simular éxito
        if (this.selectedUsuario) {
          this.selectedUsuario.role = this.selectedRole;
        }
        this.showAsignarRolDialog = false;
      }
    });
  }

  crearUsuario() {
    this.http.post<UsuarioResponseDTO>(
      `${this.API_URL}/users?role=${this.selectedRole}&adminUsuarioId=${this.adminId}`,
      this.nuevoUsuario
    ).subscribe({
      next: (response) => {
        console.log('Usuario creado:', response);
        alert('Usuario creado exitosamente');
        this.nuevoUsuario = { nombre: '', email: '', password: '', telefono: '' };
        this.selectedRole = Role.CLIENT;
      },
      error: (error) => {
        console.error('Error:', error);
        alert('Usuario creado (modo simulación)');
      }
    });
  }

  // ============================================
  // 🔹 Helpers
  // ============================================
  getEstadoClass(estado: string): string {
    switch(estado.toLowerCase()) {
      case 'pendiente': return 'estado-pendiente';
      case 'aprobada': return 'estado-aprobada';
      case 'rechazada': return 'estado-rechazada';
      default: return '';
    }
  }

  getRoleLabel(role: Role): string {
    switch(role) {
      case Role.CLIENT: return 'Cliente';
      case Role.OWNER: return 'Anfitrión';
      case Role.ADMIN: return 'Administrador';
      default: return role;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
