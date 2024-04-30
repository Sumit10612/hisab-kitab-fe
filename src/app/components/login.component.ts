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
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    ReactiveFormsModule, 
    RouterLink,
  ],
  template:`
      <div class="center">
        <img
          class="google-sign-in"
          src="/assets/web_light_rd_SI@1x.png" 
          role="button" 
          (click)="googleSignIn()" 
        />
      </div>

      <div class="separator">-- OR --</div>

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
        </div>

        <div class="login-footer">
          <a class="sign-up-link" routerLink="/sign-up">Create Account</a>
          <a (click)="forgotPassword()">Forget password?</a>
        </div>
      </form>
  `,
  styles: [`
    .login-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;      

      .sign-up-link {
        font-size: 1rem;
      }

      a {
        cursor: pointer;
        text-decoration: underline;
      }
    }

    .google-sign-in {
      cursor: pointer;
    }

    .separator {
      margin-top: 16px;
      margin-bottom: 16px;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  notificationService = inject(NotificationService);

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

    this.notificationService.showLoading();

    try {
      await this.authService.login(email, password);

      this.router.navigate(["/home"]);
    } catch (error: any) {
      this.notificationService.error(getFirebaseErrorMessage(error));
    } finally {
      this.notificationService.hideLoading();
    }
  }
  
  async googleSignIn() {
    this.notificationService.showLoading();
    try {
      await this.authService.googleSignIn();
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.notificationService.error(getFirebaseErrorMessage(error));
    } finally {
      this.notificationService.hideLoading();
    }
  }
  
  async forgotPassword() {
    const { email } = this.loginForm.value;
    if(!email) {
      this.notificationService.error("Please enter a valid email address.");
      return;
    }

    this.notificationService.showLoading();
    try {
      await this.authService.passwordReset(email);
      this.notificationService.error("Password reset email has been sent. Please check your inbox.");
    }
    catch (err: any) {
      this.notificationService.error(getFirebaseErrorMessage(err));
    } finally {
      this.notificationService.hideLoading();
    }
  }
}
