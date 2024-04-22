import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { getFirebaseErrorMessage } from '../utilities/firebase-errors';
import { Router } from '@angular/router';

export function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get("password")?.value;
    const confirmPassword = control.get("confirmPassword")?.value;

    if(password && confirmPassword && password !== confirmPassword) {
      return { passwordsDontMatch: true };
    }

    return null;
  }
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule],
  template: `
    <div class="card mat-elevation-z5">
      <h1>Sign Up</h1>
      <form [formGroup]="signUpForm" (ngSubmit)="submit()">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          @if(signUpForm.get("name")?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Email address</mat-label>
          <input matInput formControlName="email" />
          @if(signUpForm.get("email")?.hasError('required')) {
            <mat-error>Email address is required</mat-error>
          } @else if (signUpForm.get("email")?.hasError('email')) {
            <mat-error>Please enter a valid email address</mat-error>
          }
        </mat-form-field>
        
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input type="password" matInput formControlName="password" />
          @if(signUpForm.get("password")?.hasError('required')) {
            <mat-error>Password is required</mat-error>
          }
        </mat-form-field>
        
        <mat-form-field>
          <mat-label>Confirm Password</mat-label>
          <input type="password" matInput formControlName="confirmPassword" />
          @if(signUpForm.get("confirmPassword")?.hasError('required')) {
            <mat-error>Confirm Password is required</mat-error>
          }
        </mat-form-field>

        @if(signUpForm.hasError('passwordsDontMatch')) {
          <mat-error>Passwords should match</mat-error>
        }

        <div class="center margin-top">
          <button type="submit" mat-raised-button color="primary">Sign Up!</button>
        </div>
      </form>
    </div>
  `,
  styles: []
})
export class SignupComponent {
  formBuilder = inject(FormBuilder);
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  router = inject(Router);

  signUpForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordsMatchValidator() })

  async submit() {
    const { name, email, password } = this.signUpForm.value;

    if(!this.signUpForm.valid || !email || !password) {
      return;
    }

    try {
      this.notificationService.showLoading();
      const { user } = await this.authService.signUp(email, password);

      await this.authService.setDisplayName(user, name);

      this.router.navigate(["/home"]);
    } catch (err: any) {
      this.notificationService.error(getFirebaseErrorMessage(err));
    } finally {
      this.notificationService.hideLoading();
    }
  }
}
