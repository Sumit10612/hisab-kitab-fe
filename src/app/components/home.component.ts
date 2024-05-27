import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

import { getUserImage } from "../models/user.model";
import { GroupService } from "../services/group.service";
import { UserService } from "../services/user.service";

import { LayoutComponent } from "./shared/layout.component";
import { GroupWidgetComponent } from "./widgets/group-widget.component";
import { OverviewWidgetComponent } from "./widgets/overview-widget.component";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatDividerModule,
		MatCardModule,
		RouterLink,
		GroupWidgetComponent,
		OverviewWidgetComponent,
		LayoutComponent
	],
	template: `
	<app-layout>
		<div section="header" class="header-section">
		<div class="profile-section">
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
			<app-overview-widget [groups]="groupService.myGroups$ | async"></app-overview-widget>
		</div>
		</div>
		<div section="detail" class="group-widget-container">
		<mat-card-header>
			<mat-card-title>Groups</mat-card-title>
		</mat-card-header>
			<mat-card-content>
			@for (item of groupService.myGroups$ | async; track item) {
				<app-group-widget [data]="item"></app-group-widget>
			}
			</mat-card-content>
		</div>
	</app-layout>

	<div class="create-group-button">
		<a mat-fab routerLink="/group" color="warn">
		<mat-icon>group_add</mat-icon>
		</a>
	</div>
  `,
	styles: [`
	.header-section {
		.profile-section {
		display: flex;
		justify-content: space-between;
		height: 72px;
		}

		.overview-widget-container {
		height: 146px;
		}
	}   

	.group-widget-container {
		.mat-mdc-card-content {
		height: calc(100vh - 332px);
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 8px 0;
		overflow-y: auto;
		cursor: pointer;
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
