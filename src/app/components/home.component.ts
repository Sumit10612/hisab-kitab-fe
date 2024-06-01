import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

import { Group } from "../models/group.model";
import { getUserImage, GroupOrder } from "../models/user.model";
import { GroupService } from "../services/group.service";
import { UserService } from "../services/user.service";

import { LayoutComponent } from "./shared/layout.component";
import { GroupListWidgetComponent } from "./widgets/group-list-widget.component";
import { OverviewWidgetComponent } from "./widgets/overview-widget.component";
import { Subscription } from "rxjs";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		RouterLink,
		OverviewWidgetComponent,
		LayoutComponent,
		GroupListWidgetComponent
	],
	template: `
		<app-layout>
			<div section="header" class="header-section">
				<div class="header-section-profile">
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

				<div class="header-section-overview">
					<app-overview-widget [groups]="groups"></app-overview-widget>
				</div>
			</div>
			
			<div section="detail" class="detail-section">
				My Groups
				<app-group-list-selector
					[groups]="groups"
					(reorderedGroupList)="reorderGroups($event)">
				</app-group-list-selector>
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
			&-profile {
				display: flex;
				justify-content: space-between;
				height: 72px;
			}

			&-container {
				height: 146px;
			}
		}

		.detail-section {
			padding: 16px;
			height: calc(100vh - 262px);
			overflow-y: auto;
		}

		.create-group-button {
			position: absolute;
			right: 16px;
			bottom: 16px;
		}
	`]
})
export class HomeComponent implements OnInit, OnDestroy {
	private readonly groupService = inject(GroupService);

	private subscription$$?: Subscription;

	protected readonly userService = inject(UserService);

	protected getUserImage = getUserImage;
	protected groups: Group[] = [];

	ngOnInit(): void {
		this.subscription$$ = this.groupService.myGroups$.subscribe(
			groups => this.groups = groups
		);
	}

	ngOnDestroy(): void {
		this.subscription$$?.unsubscribe();
	}

	async reorderGroups($event: Group[]) {
		const user = this.userService.currentUser();
		if(!user || !$event.length) {
			return;
		}

		user.groups = $event.map((group, index) => ({ id: group.id ?? "", order: index })) as GroupOrder[];

		await this.userService.updateUser(user);
	}
}
