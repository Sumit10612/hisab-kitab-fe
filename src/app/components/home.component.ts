import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";

import { ToolbarButtonType } from "../models/toolbar.model";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { ExpenseAction } from "../store/expense/expense.action";
import { GroupSelector } from "../store/group/group.selector";

import { LayoutComponent } from "./shared/layout.component";
import { GroupListWidgetComponent } from "./widgets/group-list-widget.component";
import { OverviewWidgetComponent } from "./widgets/overview-widget.component";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [
		CommonModule,
		GroupListWidgetComponent,
		OverviewWidgetComponent,
		LayoutComponent,
	],
	template: `
		<app-layout headerHeight="152px" *ngIf="((groups$ | async) || []) as groups">
			<div section="header">
				<app-overview-widget [groups]="groups"></app-overview-widget>
			</div>
			
			<div section="detail" class="detail-section">
				My Groups
				<app-group-list-selector [groups]="groups"></app-group-list-selector>
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
export class HomeComponent implements OnInit {
	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly store = inject(Store);

	protected groups$ = this.store.select(GroupSelector.selectAll);

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
	}
}
