import {
	Component,
	computed,
	inject,
	input,
	OnInit
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterLink } from "@angular/router";
import { Store } from "@ngrx/store";

import { getGroupImage, GroupType } from "../../models/group.model";
import { ToolbarButtonType } from "../../models/toolbar.model";
import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { ExpenseSelector } from "../../store/expense/expense.selector";
import { GroupSelector } from "../../store/group/group.selector";
import { DateUtilities } from "../../utilities/date";
import { LayoutComponent } from "../shared/layout.component";

import { GroupBalancesComponent } from "./group-balances.component";
import { GroupExpenseListComponent } from "./group-expense-list.component";
import { GroupExpensesSummaryComponent } from "./group-expenses-summary.component";
import { ExpenseAction } from "../../store/expense/expense.action";

@Component({
	selector: "app-group-expesnse-detail",
	standalone: true,
	imports: [
		MatButtonToggleModule,
		MatButtonModule,
		MatIconModule,
		LayoutComponent,
		MatProgressSpinnerModule,
		GroupExpenseListComponent,
		GroupBalancesComponent,
		GroupExpensesSummaryComponent,
		RouterLink
	],
	template: `
		@if ($group(); as group) {
			<app-layout [headerHeight]="'160px'" (triggerOnScroll)="onScroll($event)">
				<div section="header" class="header-section">
					<div class="header-section-page-info">
						<img width="50" height="50" [src]="getGroupImage(group.imageUrl).src"
							[alt]="getGroupImage(group.imageUrl).alt" />
						
						<span class="header-section-page-info-name">{{group.name}}</span>

						<a mat-icon-button [routerLink]="['/group', group.id]">
							<mat-icon>settings</mat-icon>
						</a>
					</div>

					<div class="header-section-group-info">
						<div class="header-section-group-info-total">
							<span class="header-section-group-info-total-amount">
								&#8377; 
								{{ 
									isExpenseTracker
										? group.monthTotal[dateUtil.yearMonth(dateUtil.previousMonth())]
										: group.currentMember.paid
								}}
							</span>
							<span class="label">{{ isExpenseTracker ? "last month" : "you paid" }}</span>
						</div>

						<div class="header-section-group-info-month">
							<span class="header-section-group-info-month-amount">
								&#8377; 
								{{ 
									isExpenseTracker
										? group.monthTotal[dateUtil.yearMonth()]
										: group.groupTotal
								}}
							</span>
							<span class="label">{{ isExpenseTracker ? "this month" : "total balance" }}</span>
						</div>

						<div class="header-section-group-info-total">
							<span class="header-section-group-info-total-amount">
								&#8377; {{ isExpenseTracker ? group.groupTotal : group.currentMember.share }}
							</span>
							<span class="label">{{ isExpenseTracker ? "total" : "your share" }}</span>
						</div>
					</div>

					<div class="header-section-tab">
						<mat-button-toggle-group [(value)]="selectedTab" hideSingleSelectionIndicator="true">
							<mat-button-toggle value="expense">Expense</mat-button-toggle>
							@if (!isExpenseTracker) {
								<mat-button-toggle value="balance">Balance</mat-button-toggle>
							}
							<mat-button-toggle value="summary">Summary</mat-button-toggle>
						</mat-button-toggle-group>
					</div>
				</div>

				<div section="detail" class="detail-section">
					@if (selectedTab === "expense") {
						<app-group-expense-list [group]="group"></app-group-expense-list>
					} @else if (selectedTab === "balance") {
						<app-group-balances [group]="group"></app-group-balances>
					} @else {
						<app-group-expenses-summary [group]="group"></app-group-expenses-summary>
					}

					@if($loading()) {
						<div class="loading-spinner">
							<mat-progress-spinner diameter="15" mode="indeterminate"></mat-progress-spinner>
							<span class="loading-spinner-text">loading...</span>
						</div>
					}
				</div>
			</app-layout>
		}
	`,
	styles: `
		.header-section {
			display: flex;
			flex-direction: column;
			gap: 16px;
			justify-content: space-between;

			&-page-info {
				display: flex;
				gap: 16px;
				justify-content: space-between;
				text-align: center;

				&-name {
					font-size: 1.25rem;
					font-weight: 500;
				}
			}
			
			&-group-info {
				display: flex;
				gap: 16px;
				justify-content: space-between;

				&-month {
					display: flex;
					flex-direction: column;
					text-align: center;

					&-amount {
						font-size: 1.4rem;
					}
				}

				&-total {
					display: flex;
					flex-direction: column;
					text-align: center;
				}

				.label {
					font-size: 0.75rem;
				}
			}

			&-tab {
				text-align: center;
			}
		}

		.mat-button-toggle-group {
			height: 32px;
			border-radius: 16px;
			align-items: center;
		}

		.loading-spinner {
			display: flex;
			gap: 8px;
			justify-content: center;
			align-items: center;

			&-text {
				font-size: 0.6rem;
			}
		}
	`
})
export class GroupExpenseDetailComponent implements OnInit {
	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly store = inject(Store);

	protected getGroupImage = getGroupImage;
	protected selectedTab: "expense" | "summary" | "balance" = "expense";
	protected readonly dateUtil = DateUtilities;
	
	protected readonly id = input.required<string>();
	protected readonly $loading = this.store.selectSignal(ExpenseSelector.isLoading);
	protected readonly $group = computed(() =>
		this.store.selectSignal(GroupSelector.selectGroup(this.id()))()
	);

	ngOnInit() {
		this.toolbar.configure({
			back: { visible: () => this.selectedTab === "expense" ? true : false },
			actionBtns: [
				{
					type: ToolbarButtonType.Primary,
					label: "Add expense",
					disabled: () => !this.$group()?.id,
					visible: () => this.selectedTab === "expense",
					redirectTo: () => ["/group", this.id(), "expense"]
				},
				{
					type: ToolbarButtonType.Secondary,
					visible: () => this.selectedTab !== "expense",
					icon: "arrow_back",
					action: () => this.selectedTab = "expense"
				}
			]
		});
	}

	protected get isExpenseTracker(): boolean {
		return this.$group()?.groupType === GroupType.ExpenseTracker;
	}

	protected onScroll(event: boolean) {
		if (!this.$loading() && event) {
			this.store.dispatch(ExpenseAction.getNext({ groupId: this.id(), initialGet: false }));
		}		
	}
}
