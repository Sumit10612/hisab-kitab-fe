import { Component, inject } from '@angular/core';
import { 
  AbstractControl, 
  NonNullableFormBuilder, 
  ReactiveFormsModule, 
  ValidationErrors, 
  ValidatorFn, 
  Validators 
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { getFirebaseErrorMessage } from '../utilities/firebase-errors';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

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
  `,
  styles: []
})
export class SignupComponent {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  
  formBuilder = inject(NonNullableFormBuilder);

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
      const { user: { uid } } = await this.authService.signUp(email, password);

      await this.userService.addUser({ uid, email, name });

      this.router.navigate(["/home"]);
    } catch (err) {
      this.notificationService.error(getFirebaseErrorMessage(err));
    } finally {
      this.notificationService.hideLoading();
    }
  }
}
