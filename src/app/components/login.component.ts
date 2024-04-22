import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { getFirebaseErrorMessage } from '../utilities/firebase-errors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, RouterLink],
  template:`
    <div class="card mat-elevation-z5">
      <h1>Login</h1>
      <form [formGroup]="loginForm" (ngSubmit)="login()">
        <mat-form-field>
          <mat-label>Email address</mat-label>
          <input matInput formControlName="email" />
          @if(loginForm.get("email")?.hasError('required')) {
            <mat-error>Email address is required</mat-error>
          } @else if (loginForm.get("email")?.hasError('email')) {
            <mat-error>Please enter a valid email address</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Password</mat-label>
          <input type="password" matInput formControlName="password" />
          @if(loginForm.get("password")?.hasError('required')) {
            <mat-error>Password is required</mat-error>
          }
        </mat-form-field>

        <div class="center margin-top button-section">
          <button type="submit" mat-raised-button color="primary">Login</button>
          <span>or</span>
          <a class="button" routerLink="/sign-up">Sign up!</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .button-section {
      display: flex;
      gap: 8px;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  notificationServive = inject(NotificationService);

  formBuilder = inject(FormBuilder);

  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  async login() {
    const { email, password } = this.loginForm.value;

    if(!this.loginForm.valid || !email || !password) {
      return;
    }

    this.notificationServive.showLoading();

    try {
      await this.authService.login(email, password);

      this.router.navigate(["/home"]);
    } catch (error: any) {
      this.notificationServive.error(getFirebaseErrorMessage(error));
    } finally {
      this.notificationServive.hideLoading();
    }
  }
}
