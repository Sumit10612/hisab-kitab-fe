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

        <div class="icon-container">
          @for (item of icons; track item) {
            <div>
              <button type="button" mat-icon-button
                [class.selected]="selectedIndex === $index"
                color=""
                (click)="selectImage($index)">
                <mat-icon [color]="(selectedIndex === $index)? 'warn' : ''">
                  {{item.icon}}
                </mat-icon>                
              </button>
              <span>{{item.name}}</span>
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

      .icon-container {
        display: flex;
        overflow-x: auto;
        margin-bottom: 16px;
        white-space: nowrap;

        > div {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 16px;
          transition: all 0.3s ease;
          border-radius: 100%;

          mat-icon {
            transform: scale(1.2);
          }
        }

        .selected {
          transform: scale(2);
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

  protected  icons = [
    { icon: "home", name: "Home" }, 
    { icon: "sailing", name: "Vacation" },
    { icon: "person", name: "Personal" },
    { icon: "apartment", name: "Office" },
    { icon: "sports_soccer", name: "Sports" },
    { icon: "diversity_3", name: "Others" },
  ];
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
    if(!name || !this.selectedIndex) {
      return;
    }

    try {
      this.notification.showLoading()
      const groupId = await this.groupService.createGroup(
        name, 
        this.icons[this.selectedIndex].icon
      );

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
