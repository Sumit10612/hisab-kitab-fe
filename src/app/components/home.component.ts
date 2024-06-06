import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { Store } from "@ngrx/store";
import { filter, Subscription, switchMap, tap } from "rxjs";

import { Group } from "../models/group.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { GroupOrder, User } from "../models/user.model";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { GroupAction } from "../store/group/group.action";
import { GroupSelector } from "../store/group/group.selector";
import { UserAction } from "../store/user/user.action";
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
	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly store = inject(Store);

	private user?: User;
	private subscription$$?: Subscription;

	protected groups: Group[] = []; 

	ngOnInit(): void {
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

		this.subscription$$ = this.store.select(UserSelector.select).pipe(
			tap(user => this.user = user),
			filter(user => !!(user?.groupIds?.length && user.groups?.length)),
			switchMap(user => this.store.select(GroupSelector.selectGroups()).pipe(
				tap(groups => {
					if(!groups.length) {
						this.store.dispatch(GroupAction.getAll({
							ids: user?.groupIds ?? [],
							groups: user?.groups ?? []
						}));
					}
				}))
			)
		).subscribe(groups => this.groups = groups);
	}

	ngOnDestroy(): void {
		this.subscription$$?.unsubscribe();
	}

	reorderGroups($event: Group[]) {
		if (!this.user || !$event.length) {
			return;
		}

		this.user.groups = $event.map((group, index) => ({ id: group.id ?? "", order: index })) as GroupOrder[];
		this.store.dispatch(UserAction.update({ user: this.user }));
	}
}
