import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { Store } from "@ngrx/store";
import { of, Subscription, switchMap } from "rxjs";

import { Group } from "../models/group.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { GroupOrder } from "../models/user.model";
import { GroupService } from "../services/group.service";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { UserService } from "../services/user.service";
import { UserSelector } from "../store/user/user.selector";

import { LayoutComponent } from "./shared/layout.component";
import { GroupListWidgetComponent } from "./widgets/group-list-widget.component";
import { OverviewWidgetComponent } from "./widgets/overview-widget.component";

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
		<app-layout headerHeight="152px">
			<div section="header">
				<app-overview-widget [groups]="groups"></app-overview-widget>
			</div>
			
			<div section="detail" class="detail-section">
				My Groups
				<app-group-list-selector
					[groups]="groups"
					(reorderedGroupList)="reorderGroups($event)">
				</app-group-list-selector>
			</div>
		</app-layout>
	`,
	styles: [`
		.detail-section {
			padding: 16px;
			height: calc(100vh - 256px);
			overflow-y: auto;
		}

		.create-group-button {
			position: absolute;
			right: 4px;
			bottom: 4px;
		}
	`]
})
export class HomeComponent implements OnInit, OnDestroy {
	private readonly groupService = inject(GroupService);
	private readonly userService = inject(UserService);
	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly store = inject(Store);

	private subscription$$?: Subscription;

	protected groups: Group[] = [];

	ngOnInit(): void {
		this.subscription$$ = this.store.select(UserSelector.select).pipe(
			switchMap(user => {
				if(user?.groupIds?.length && user?.groups?.length) {
					return this.groupService.getGroups$(user.groupIds, user.groups);
				} else {
					return of([]);
				}
			})
		).subscribe(groups => this.groups = groups);

		this.toolbar.configure({
			profile: { visible: true },
			actionBtns: [
				{
					type: ToolbarButtonType.Primary,
					label: "Create Group",
					redirectTo: "/group"
				}
			]
		});
	}

	ngOnDestroy(): void {
		this.subscription$$?.unsubscribe();
	}

	async reorderGroups($event: Group[]) {
		const user = this.userService.currentUser();
		if (!user || !$event.length) {
			return;
		}

		user.groups = $event.map((group, index) => ({ id: group.id ?? "", order: index })) as GroupOrder[];

		await this.userService.update$(user);
	}
}
