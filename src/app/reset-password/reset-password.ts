import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../services/auth.service'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, InputTextModule, ButtonModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {
  resetForm: FormGroup;
  token: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Capturamos el token de la URL: /reset-password?token=xxxx
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      alert('Token no encontrado. Por favor, solicita un nuevo correo de recuperación.');
      this.router.navigate(['/forgot-password']);
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.resetForm.valid && this.token) {
      this.loading = true;
      const nuevaPassword = this.resetForm.get('password')?.value;

      // Llamamos al servicio (asegúrate de tener este método en AuthService)
      this.authService.resetPassword(this.token, nuevaPassword).subscribe({
        next: (res) => {
          alert('Contraseña actualizada con éxito. Ahora puedes iniciar sesión.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          alert('Error al restablecer la contraseña. El token puede haber expirado.');
          this.loading = false;
        }
      });
    }
  }

  get isPasswordInvalid() {
    const control = this.resetForm.get('password');
    return control?.invalid && control?.touched;
  }

  get isMismatch() {
    return this.resetForm.hasError('mismatch') && this.resetForm.get('confirmPassword')?.touched;
  }
}
