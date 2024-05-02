import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { getFirebaseErrorMessage } from '../utilities/firebase-errors';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    ReactiveFormsModule, 
    RouterLink,
    MatDividerModule
  ],
  template:`
      <div class="section">
        <img
          class="google-sign-in"
          src="/assets/google-sign-in.png"
          width="70%"
          role="button" 
          (click)="googleSignIn()" 
        />
      </div>

      <mat-divider></mat-divider>

      <form class="section" [formGroup]="loginForm" (ngSubmit)="login()">
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

        <div class="section-footer">
          <a routerLink="/sign-up">Create Account</a>
          <a (click)="forgotPassword()">Forget password?</a>
        </div>
      </form>
  `,
  styles: [`
    .section {
      margin: 16px 0;
      text-align: center;

      &-footer {
        display: flex;
        justify-content: space-between;
        margin-top: 16px;

        a {
          cursor: pointer;
          text-decoration: underline;
        }
      }
    }

    .google-sign-in {
      cursor: pointer;
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);

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
    try {
      this.notificationService.showLoading();
      const newUser = await this.authService.googleSignIn();
      if(newUser) {
        await this.userService.addUser(newUser);
      }

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
