import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

import { getUserImage } from "../models/user.model";
import { GroupService } from "../services/group.service";
import { UserService } from "../services/user.service";

import { GroupWidgetComponent } from "./widgets/group-widget.component";
import { OverviewWidgetComponent } from "./widgets/overview-widget.component";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [
		MatButtonModule, 
		MatIconModule,
		MatDividerModule,
		MatCardModule,
		RouterLink,
		GroupWidgetComponent,
		OverviewWidgetComponent
	],
	template: `
    <div class="container">
      <div class="header-section">
        <a routerLink="/profile">
          <img
            width="55" 
            height="55"
            [src]="getUserImage(userService.currentUser()?.photoUrl).src"
            [alt]="getUserImage(userService.currentUser()?.photoUrl).alt" 
          />
        </a>

        <button mat-fab color="secondary">
            <mat-icon>notifications</mat-icon>
        </button>
      </div>

      <div class="overview-widget-container">
        <app-overview-widget></app-overview-widget>
      </div>

      <mat-card class="group-widget-container">
        <mat-card-header>
          <mat-card-title>Groups</mat-card-title>          
        </mat-card-header>
          <mat-card-content>
            @for (item of groupService.myGroups(); track item) {
              <app-group-widget [data]="item"></app-group-widget>
            }
          </mat-card-content>
      </mat-card>
    </div>  

    <div class="create-group-button">
      <a mat-fab routerLink="/create-group" color="warn">
        <mat-icon>group_add</mat-icon>
      </a>
    </div>
  `,
	styles: [`
    .container {
      background-color: #964b04;
      margin: -16px;

      .header-section {
        display: flex;
        justify-content: space-between;
        padding: 16px 16px 0 16px;
        height: 72px;
      }

      .overview-widget-container {
        padding: 0 16px 16px 16px;
        height: 146px;
      }
    }    

    .group-widget-container {
      height: calc(100vh - 250px);
      border-radius: 32px 32px 0 0;

      .mat-mdc-card-content {
        height: 60vh;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 8px 0;
        overflow-y: auto;
      }
    }

    .create-group-button {
        position: absolute;
        right: 24px;
        bottom: 24px;
    }
  `]
})
export class HomeComponent {
	protected readonly userService = inject(UserService);
	protected readonly groupService = inject(GroupService);

	protected getUserImage = getUserImage;
}
