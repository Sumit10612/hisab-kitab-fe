import { CommonModule } from "@angular/common";
import {
	Component,
	ElementRef,
	inject,
	OnInit,
	ViewChild
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterLink } from "@angular/router";
import { Store } from "@ngrx/store";
import {
	groupBy,
	mapKeys,
	mapValues,
	pick,
	values
} from "lodash-es";
import { filter, map, switchMap, tap } from "rxjs";

import { getGroupImage, Group, GroupType } from "../models/group.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { RouterSelector } from "../store/app.selector";
import { ExpenseAction } from "../store/expense/expense.action";
import { ExpenseSelector } from "../store/expense/expense.selector";
import { GroupSelector } from "../store/group/group.selector";
import { getPreviousMonth, getYearMonth } from "../utilities/date";

import { ExpensesSummaryComponent } from "./expenses-summary.component";
import { LayoutComponent } from "./shared/layout.component";
import { ExpenseListComponent } from "./widgets/expense-list-widget.component";
import { GroupBalancesComponent } from "./widgets/group-balances.component";

@Component({
	selector: "app-group-expesnse-detail",
	standalone: true,
	imports: [
		CommonModule,
		MatButtonToggleModule,
		MatButtonModule,
		MatIconModule,
		LayoutComponent,
		MatProgressSpinnerModule,
		GroupBalancesComponent,
		ExpenseListComponent,
		ExpensesSummaryComponent,
		RouterLink
	],
	template: `
		<app-layout [headerHeight]="'160px'">
			<div section="header" class="header-section">
				<div class="header-section-page-info">
					<img width="50" height="50" [src]="getGroupImage(group?.imageUrl).src"
						[alt]="getGroupImage(group?.imageUrl).alt" />
					
					<span class="header-section-page-info-name">{{group?.name}}</span>

					<a mat-icon-button [routerLink]="['/group', group?.id]" [disabled]="!group">
						<mat-icon>settings</mat-icon>
					</a>
				</div>

				<div class="header-section-group-info">
					<div class="header-section-group-info-total">
						<span class="header-section-group-info-total-amount">
							&#8377; {{ isExpenseTracker ? lastMonthTotal : youPaid }}
						</span>
						<span class="label">{{ isExpenseTracker ? "last month" : "you paid" }}</span>
					</div>

					<div class="header-section-group-info-month">
						<span class="header-section-group-info-month-amount">
							&#8377; {{ isExpenseTracker ? currentMonthTotal : group?.groupTotal}}
						</span>
						<span class="label">{{ isExpenseTracker ? "this month" : "total balance" }}</span>
					</div>

					<div class="header-section-group-info-total">
						<span class="header-section-group-info-total-amount">
							&#8377; {{ isExpenseTracker ? group?.groupTotal : yourShare }}
						</span>
						<span class="label">{{ isExpenseTracker ? "total" : "your share" }}</span>
					</div>
				</div>

				<div class="header-section-tab">
					<mat-button-toggle-group [(value)]="selectedTab" hideSingleSelectionIndicator="true">
						<mat-button-toggle value="expense">Expense</mat-button-toggle>
						<mat-button-toggle *ngIf="!isExpenseTracker" value="balance">Balance</mat-button-toggle>
						<mat-button-toggle value="summary">Summary</mat-button-toggle>
					</mat-button-toggle-group>
				</div>
			</div>

			<div section="detail" class="detail-section" #scrollContainer (scroll)="onScroll()">
				@if (selectedTab === "expense") {
					<app-expense-list [groupId]="group?.id" [expensesByMonth]="expenses$ | async"></app-expense-list>
				} @else if (selectedTab === "balance") {
					<app-group-balances [group]="group"></app-group-balances>
				} @else {
					<app-expenses-summary [group]="group"></app-expenses-summary>
				}

				@if(loading$ | async) {
					<div class="loading-spinner">
						<mat-progress-spinner diameter="15" mode="indeterminate"></mat-progress-spinner>
						<span class="loading-spinner-text">loading...</span>
					</div>
				}
			</div>
		</app-layout>
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

		.detail-section {
			height: calc(100vh - 248px);
			overflow-y: auto;
			padding: 0 16px;
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
	@ViewChild("scrollContainer", { static: false }) scrollContainer: ElementRef | undefined;

	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly store = inject(Store);

	protected group: Group | undefined;
	protected getGroupImage = getGroupImage;
	protected selectedTab: string = "expense";
	protected loading = false;
	protected loading$ = this.store.select(ExpenseSelector.isLoading).pipe(
		tap(loading => this.loading = loading)
	);
	protected expenses$ = this.store.select(RouterSelector.selectParams).pipe(
		switchMap(params => this.store.select(GroupSelector.selectGroup(params["id"])).pipe(
			tap(group => this.group = group),
			filter(group => !!group),
			switchMap(group => this.store.select(ExpenseSelector.selectAllExpenses).pipe(
				tap(expenses => {
					if (!expenses.length && group) {
						this.store.dispatch(ExpenseAction.getNext({ groupId: group.id, initialGet: true }));
					}
				}),
				map(expenses => {
					const members = pick(group?.members ?? {}, group?.memberIds ?? []);
					return mapValues(
						groupBy(expenses, e => getYearMonth(e.expenseDate)),
						es => es.map(e => ({
							...e, 
							paidBy: members[e.paidBy].name,
							usersShare: this.isExpenseTracker ? {} : mapKeys(e.usersShare, (_value, key) => members[key].name)
						}))
					);
				})
			))
		))
	);

	ngOnInit() {
		this.toolbar.configure({
			back: { visible: () => this.selectedTab === "expense" ? true : false },
			actionBtns: [
				{
					type: ToolbarButtonType.Primary,
					label: "Add expense",
					disabled: () => !this.group?.id,
					visible: () => this.selectedTab === "expense",
					redirectTo: () => ["/group", this.group?.id ?? "", "expense"]
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
		return this.group?.groupType === GroupType.ExpenseTracker;
	}

	protected get currentMonthTotal(): number {
		const currentMonth = getYearMonth(new Date());
		return this.group?.monthTotal[currentMonth] ?? 0;
	}

	protected get lastMonthTotal() {
		const lastMonth = getPreviousMonth(new Date());
		return this.group?.monthTotal[getYearMonth(lastMonth)] ?? 0;
	}

	protected get youPaid(): number {
		const you = values(this.group?.members).find(member => member.name === "You");
		return you?.paid ?? 0;
	}

	protected get yourShare(): number {
		const you = values(this.group?.members).find(member => member.name === "You");
		return you?.share ?? 0;
	}

	protected onScroll() {
		if (this.loading || !this.scrollContainer?.nativeElement.scrollTop || this.selectedTab !== "expense") {
			return;
		}

		const element = this.scrollContainer.nativeElement;
		if ((element.scrollHeight - element.clientHeight <= element.scrollTop + 1) && this.group) {
			this.store.dispatch(ExpenseAction.getNext({ groupId: this.group.id, initialGet: false }));
		}
	}
}
