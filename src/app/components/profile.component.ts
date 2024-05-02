import { Component, effect, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService } from '../services/theme.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { UserService } from '../services/user.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatIcon,
    MatDividerModule,
    MatInputModule,
    MatButtonToggleModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="profile-section">
      <img
          width="100" 
          height="100"
          class="mat-elavation-z1"
          src="/assets/image-placeholder.png" 
      />

      <div class="profile-section-info margin-top">
        <span>{{userService.currentUser()?.name}}</span>
        <span>{{userService.currentUser()?.email}}</span>
        
        <a>edit</a>
      </div>
    </div>

    <mat-divider></mat-divider>

    <div class="margin-top">
      <mat-slide-toggle labelPosition="before" (click)="toggelTheme()">Dark mode</mat-slide-toggle>
    </div>
      
    <div class="margin-top text-center">
      <button mat-raised-button color="primary" (click)="logout()">Logout</button>
    </div>
  `,
  styles: [
    `
      .profile-section {
        display: block;

        > img {
          border-radius: 100%;
          object-fit: cover;
          object-position: center;
        }

        &-info {
          float: right;
          display: flex;
          flex-direction: column;

          > a {
            justify-content: center;
          }
        }
      }
    `
  ]
})
export class ProfileComponent {
  private router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  
  protected readonly userService = inject(UserService);
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  protected readonly form = this.formBuilder.group({
    uid: [''],
    name: this.formBuilder.control({ value: '', disabled: true })
  });

  constructor() {
    effect(() => {
      this.form.patchValue({ ...this.userService.currentUser() })
    });
  }

  async logout() {
    await this.authService.logout();

    this.router.navigate(["/login"]);
  }
  
  toggelTheme() {
    this.themeService.updateTheme();
  }
}
