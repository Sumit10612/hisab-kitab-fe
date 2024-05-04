import { Component, effect, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../services/notification.service';
import { getFirebaseErrorMessage } from '../utilities/firebase-errors';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  template: `
    <div class="nav-section">
      <a role="button"
        mat-icon-button 
        routerLink="/profile">
        <mat-icon>arrow_back_ios</mat-icon>
      </a>

      <h2>Edit Profile</h2>
    </div>

    <div class="edit-profile-section">
      <form [formGroup]="form" (ngSubmit)="update()">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput [formControl]="form.controls.name" />
        </mat-form-field>

        <div class="text-center">
          <button 
            type="submit" 
            mat-raised-button 
            color="primary"
            [disabled]="!form.dirty">
            Update
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .edit-profile-section {
      margin: 16px;
    }
  `]
})
export class EditProfileComponent {
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  
  protected readonly formBuilder = inject(NonNullableFormBuilder);

  protected form = this.formBuilder.group({
    uid: [''],
    name: ['']
  });

  constructor() {
    effect(() => {
      this.form.patchValue({ ...this.userService.currentUser() })
    });
  }

  async update() {
    const { uid, ...data } = this.form.value;

    if(!uid) {
      return;
    }

    try {
      this.notificationService.showLoading();
      await this.userService.updateUser({ uid, ...data });

      this.router.navigate(["/profile"]);
    } catch (err) {
      this.notificationService.error(getFirebaseErrorMessage(err));
    } finally {
      this.notificationService.hideLoading();
    }
  }
}
