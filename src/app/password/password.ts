import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-password',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, InputTextModule, ButtonModule],
  templateUrl: './password.html',
  styleUrl: './password.scss',
})
export class Password {
  forgotPasswordForm: FormGroup;
  emailSent: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      console.log('Recuperar contraseña para:', this.forgotPasswordForm.value);
      // Aquí iría la lógica para enviar el email
      // this.authService.forgotPassword(this.forgotPasswordForm.value).subscribe(...)
      
      // Simular envío exitoso
      this.emailSent = true;
      
      // Opcionalmente redirigir después de unos segundos
      setTimeout(() => {
        this.goToLogin();
      }, 3000);
    } else {
      this.email?.markAsTouched();
    }
  }

  goToLogin() {
    console.log('Ir a login');
    this.router.navigate(['/login']);
  }

  // Helpers para validación
  get email() {
    return this.forgotPasswordForm.get('email');
  }

  get isEmailInvalid() {
    return this.email?.invalid && this.email?.touched;
  }

  getEmailError(): string {
    if (this.email?.hasError('required')) return 'El email es requerido';
    if (this.email?.hasError('email')) return 'Email inválido';
    return '';
  }

}
