import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIcon
  ],
  template: `
    <div class="text-center">
      <div class="profile-image">
        <img
          width="120" 
          height="120"
          class="margin-top mat-elavation-z1"
          src="/assets/image-placeholder.png"
        />
        <button mat-mini-fab>
          <mat-icon>edit</mat-icon>
        </button>
      </div>

      <h1>{{authService.currentUser()?.displayName}}</h1>
      
      <div class="margin-top">
        <button mat-raised-button color="primary" (click)="logout()">Logout</button>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-image {
        position: relative;
        width: 120px;
        margin: auto;

        > img {
          border-radius: 100%;
          object-fit: cover;
          object-position: center;
        }

        > button {
          position: absolute;
          bottom: 10px;
          right: 0;
        }
      }
    `
  ]
})
export class ProfileComponent {
  private router = inject(Router);

  protected readonly authService = inject(AuthService);

  async logout() {
    await this.authService.logout();

    this.router.navigate(["/login"]);
  }
}
