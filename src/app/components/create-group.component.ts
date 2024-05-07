import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../services/notification.service';
import { GroupService } from '../services/group.service';
import { getFirebaseErrorMessage } from '../utilities/firebase-errors';
import { UserService } from '../services/user.service';
import { Image } from '../models/image.model';
import { groupImages } from '../models/group.model';

@Component({
  selector: 'app-create-group',
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
        routerLink="/home">
        <mat-icon>arrow_back_ios</mat-icon>
      </a>

      <h2>Create a Group</h2>
    </div>

    <div class="create-group-section">
      <form [formGroup]="form" (ngSubmit)="create()">
        <mat-form-field>
          <mat-label>Group Name</mat-label>
          <input matInput [formControl]="form.controls.name" />
        </mat-form-field>

        <div class="image-container">
          @for (item of groupImages; track item) {
            <div>
              <img
                width="48"
                height="48"
                [class.selected]="selectedIndex === $index"
                [src]="item.src"
                [alt]="item.alt"
                (click)="selectImage($index)" />
              <span>{{item.alt}}</span>
            </div>      
          }
        </div>

        <div class="text-center">
          <button 
            type="submit" 
            mat-raised-button 
            color="primary"
            [disabled]="!form.dirty || !(selectedIndex === 0 ? 1 : selectedIndex)">
            Create
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-group-section {
      margin: 16px;

      .image-container {
        display: flex;
        overflow-x: auto;
        margin-bottom: 24px;
        white-space: nowrap;

        > div {
          display: flex;
          flex-direction: column;
          align-items: center;

          > img {
            margin: 8px 8px 0 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          > span {
            margin-bottom: 8px;
          }

          .selected {
            transform: scale(1.4);
          }
        }        
      }
    }
  `]
})
export class CreateGroupComponent {
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly groupService = inject(GroupService);
  private readonly usersService = inject(UserService);
  
  protected readonly formBuilder = inject(NonNullableFormBuilder);

  protected  groupImages = groupImages;
  protected selectedIndex: number | undefined;
  protected form = this.formBuilder.group({
    name: ['', [Validators.required]],
  });

  selectImage(index: number) {
    this.selectedIndex = index;
    this.form.markAsDirty();
  }

  async create() {
    const { name } = this.form.value;
    if(!name || this.selectedIndex == undefined) {
      return;
    }

    try {
      this.notification.showLoading()
      const groupId = await this.groupService.createGroup({
        name, 
        imageUrl: this.groupImages[this.selectedIndex].alt
      });

      const currentUser = this.usersService.currentUser();
      if(currentUser) {
        await this.usersService.updateUser({
          ...currentUser,
          groups: [
            ...currentUser.groups ?? [],
            groupId
          ]
        })
      }

      this.router.navigate(["home"]);
    } catch (error) {
      this.notification.error(getFirebaseErrorMessage(error));
    } finally {
      this.notification.hideLoading();
    }
  }
}
