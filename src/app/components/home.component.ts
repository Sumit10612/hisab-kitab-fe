import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { MatDividerModule } from '@angular/material/divider';
import { GroupService } from '../services/group.service';
import { GroupWidgetComponent } from './widgets/group-widget.component';
import { OverviewWidgetComponent } from './widgets/overview-widget.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatButtonModule, 
    MatIconModule,
    MatDividerModule,
    RouterLink,
    GroupWidgetComponent,
    OverviewWidgetComponent
  ],
  template: `
    <div class="header-section">
      <a routerLink="/profile">
        <img
          width="55" 
          height="55"
          class="mat-elevation-z10"
          [src]="(userService.currentUser()?.photoUrl) ?? '/assets/avatars/avatar_0.png'"
          alt="placeholder" 
        />
      </a>

      <button mat-fab color="secondary">
          <mat-icon>notifications</mat-icon>
      </button>
  </div>

  <div class="overview-widget-container">
    <overview-widget></overview-widget>
  </div>

  <span>Groups</span>
  <div class="group-widget-container">
    @for (item of groupService.myGroups(); track item) {
      <group-widget [data]="item"></group-widget>
    }
  </div>

  <div class="create-group-button">
    <a mat-fab routerLink="/create-group" color="warn">
      <mat-icon>group_add</mat-icon>
    </a>
  </div>
  `,
  styles: [`
    .header-section {
      display: flex;
      justify-content: space-between;
      height: 10vh;

      > a > img {
        border-radius: 100%;
      }
    }
    
    .overview-widget-container {
      height: 20vh;
    }

    .group-widget-container {
      height: 60vh;
      margin: 8px 0;

      display: flex;
      flex-direction: column;
      overflow-y: auto;
      gap: 8px;
    }

    .create-group-button {
        position: absolute;
        right: 24px;
        bottom: 24px;
    }

    .mat-icon {
      vertical-align: middle;
    }
  `]
})
export class HomeComponent {
  protected readonly userService = inject(UserService);
  protected readonly groupService = inject(GroupService);
}
