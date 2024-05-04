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
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
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

        <div class="image-container">
          @for (item of imageUrls; track item) {
            <img
              width="50"
              height="50"
              [class.selected]="selectedIndex === $index"
              class="mat-elevation-z1"
              [src]="'/assets/avatars/avatar_' + ($index) + '.png'"
              alt="placeholder"
              (click)="selectImage($index)" />
          }
        </div>

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

      .image-container {
        display: flex;
        overflow-x: auto;
        margin-bottom: 16px;
        white-space: nowrap;

        > img {
          border-radius: 100%;
          margin: 16px 0 16px 12px;
          border-radius: 100%;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .selected {
          transform: scale(1.4);
        }
      }
    }
  `]
})
export class EditProfileComponent {
  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  
  protected readonly formBuilder = inject(NonNullableFormBuilder);

  protected  imageUrls: string[] = [
    "/assets/avatars/avatar_0.png",
    "/assets/avatars/avatar_1.png",
    "/assets/avatars/avatar_2.png",
    "/assets/avatars/avatar_3.png",
    "/assets/avatars/avatar_4.png",
    "/assets/avatars/avatar_5.png",
  ];
  protected selectedIndex: number = 0;
  protected form = this.formBuilder.group({
    uid: [''],
    name: [''],
    photoUrl: [''],
  });

  constructor() {
    effect(() => {
      this.form.patchValue({ ...this.userService.currentUser() })
    });
  }

  selectImage(index: number) {
    this.selectedIndex = index;
    this.form.controls.photoUrl.setValue(this.imageUrls[index]);
    this.form.markAsDirty();
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
