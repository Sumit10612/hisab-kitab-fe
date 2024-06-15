import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";
import { Subscription } from "rxjs";

import { Group } from "../models/group.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { GroupOrder } from "../models/user.model";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { GroupAction } from "../store/group/group.action";
import { GroupSelector } from "../store/group/group.selector";

import { LayoutComponent } from "./shared/layout.component";
import { GroupListWidgetComponent } from "./widgets/group-list-widget.component";
import { OverviewWidgetComponent } from "./widgets/overview-widget.component";
import { ExpenseAction } from "../store/expense/expense.action";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [
		GroupListWidgetComponent,
		OverviewWidgetComponent,
		LayoutComponent,
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

	private subscription$$?: Subscription;

	protected groups: Group[] = [];

	ngOnInit(): void {
		this.store.dispatch(ExpenseAction.reset());

		this.toolbar.configure({
			profile: { visible: true },
			actionBtns: [
				{
					type: ToolbarButtonType.Primary,
					label: "Add Group",
					redirectTo: () => "/group"
				}
			]
		});

		this.subscription$$ = this.store.select(GroupSelector.selectAll).subscribe(groups => this.groups = groups);
	}

	ngOnDestroy(): void {
		this.subscription$$?.unsubscribe();
	}

	reorderGroups($event: Group[]) {
		if (!$event.length) {
			return;
		}

		const reorderedGroups = $event.map((group, index) => ({ id: group.id ?? "", order: index })) as GroupOrder[];
		this.store.dispatch(GroupAction.reorderGroups({ reorderedGroups }));
	}
}
