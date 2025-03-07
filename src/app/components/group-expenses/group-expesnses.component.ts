import {
	Component,
	computed,
	inject,
	input,
	OnInit
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterLink } from "@angular/router";
import { Store } from "@ngrx/store";

import { GroupType } from "../../models/group.model";
import { ToolbarButtonType } from "../../models/toolbar.model";
import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { ExpenseSelector } from "../../store/expense/expense.selector";
import { GroupSelector } from "../../store/group/group.selector";
import { DateUtilities } from "../../utilities/date";
import { LayoutComponent } from "../shared/layout.component";

import { ExpenseAction } from "../../store/expense/expense.action";
import { CommonModule } from "@angular/common";
import { DEFAULT_CATEGORY } from "../../models/category.model";
import { Expense } from "../../models/expense.model";
import { groupBy, map, mapKeys, mapValues, pick, pickBy, size } from "lodash-es";
import { DividerComponent } from "../shared/divider.component";
import { GroupExpensesHeaderComponent } from "./group-expenses-header.component";

@Component({
	selector: "app-group-expesnses",
	standalone: true,
	imports: [
		CommonModule,
		DividerComponent,
		LayoutComponent,
		MatIconModule,
		MatProgressSpinnerModule,
		GroupExpensesHeaderComponent,
		RouterLink
	],
	template: `
		@if ($group(); as group) {
			<app-layout [headerHeight]="'160px'" (triggerOnScroll)="onScroll($event)">
				<div section="header">
					<app-group-expenses-header [group]="group" page="expense"></app-group-expenses-header>
				</div>

				<div section="detail">
					@for (kvp of $expensesByMonth() | keyvalue: noSort; track kvp.key) {
						<div class="expense-record-container">
							<div class="month-group">{{ kvp.key | date: "MMMM yyyy" | uppercase }}</div>
							@for (expense of kvp.value; track expense.id) {
								<a class="expense-record" [routerLink]="['/group', group.id, 'expense', expense.id]">
									<span class="expense-date">
										<span class="expense-date-month">{{expense.expenseDate | date: "MMM" | uppercase}}</span>
										<span class="expense-date-date">{{expense.expenseDate | date: "dd"}}</span>
									</span>
									<span class="emojis">{{getCategoryIcon(expense?.category ?? 0)}}</span>
									<span class="expense-desc">
										<span>{{expense.description}}</span>
										@if (expense.where) {
											<span class="expense-desc-where">at {{expense.where}}</span>
										}
										<span class="expense-desc-user-shares">
											{{getUserSharesToDisplay(expense)}}
										</span>
									</span>
									<span class="expense-amount">
										<span class="expense-amount-paid-by">{{expense.paidBy.split(' ')[0] | lowercase}} paid</span>
										&#8377; {{expense.amount}}
									</span>
								</a>
								@if ($index !== kvp.value.length - 1) {
									<app-divider></app-divider>
								}
							}
						</div>
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
		.expense-record-container {
			margin-bottom: 16px;

			.month-group {
				font-weight: 500;
				font-size: 0.9rem;
				margin: 8px 0;
			}

			> mat-divider {
				margin: 4px 16px;
			}

			.expense-record {
				text-decoration: none;
				color: inherit;
				display: grid;
				grid-template-columns: 0.5fr 0.5fr 2.75fr 1.25fr;
				grid-gap: 8px;
				width: 100%;
				margin: 0 8px;
				align-items: center;

				.expense-date {
					display: flex;
					flex-direction: column;
					align-items: center;

					&-month {
						font-size: 0.6rem;
					}

					&-date {
						font-size: 1.1rem
					}
				}

				.expense-desc {
					display: flex;
					flex-direction: column;

					&-where {
						font-size: 0.6rem;
					}

					&-user-shares {
						font-size: 0.6rem;
					}
				}

				.expense-amount {
					display: flex;
					flex-direction: column;

					&-paid-by {
						font-size: 0.6rem;
					}
				}
			}
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
export class GroupExpensesComponent implements OnInit {
	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly store = inject(Store);

	private readonly $expenses = this.store.selectSignal(ExpenseSelector.selectAllExpenses);
	
	protected readonly groupId = input.required<string>();
	protected readonly $group = computed(() =>
		this.store.selectSignal(GroupSelector.selectGroup(this.groupId()))()
	);
	protected readonly $loading = this.store.selectSignal(ExpenseSelector.isLoading);
	protected readonly $expensesByMonth = computed(() => {
		const group = this.$group();
		if(!group) {
			return;
		}

		const members = pick(group.members, group.memberIds);
		return mapValues(
			groupBy(this.$expenses(), e => DateUtilities.yearMonth(e.expenseDate)),
			es => es.map(e => ({
				...e, 
				paidBy: members[e.paidBy].name,
				usersShare: group.groupType === GroupType.ExpenseTracker 
					? {}
					: mapKeys(e.usersShare, (_value, key) => members[key].name)
			}))
		);
	});

	ngOnInit() {
		this.toolbar.configure({
			back: { visible: () => true },
			actionBtns: [
				{
					type: ToolbarButtonType.Primary,
					label: "Add expense",
					disabled: () => !this.groupId(),
					redirectTo: () => ["/group", this.groupId(), "expense"]
				}
			]
		});

		if(!this.$expenses().length) {
			this.store.dispatch(ExpenseAction.getNext({ groupId: this.groupId(), initialGet: true }));
		}
	}

	protected onScroll(event: boolean) {
		if (!this.$loading() && event) {
			this.store.dispatch(ExpenseAction.getNext({ groupId: this.groupId(), initialGet: false }));
		}		
	}

	protected getUserSharesToDisplay(expense: Expense): string | undefined {
		const usersShare = pickBy(expense.usersShare, value => value > 0);
		if(size(usersShare) === 0) {
			return undefined;
		}

		return map(usersShare, (value, key) => `${key}: ${value}`).join(" | ");
	}

	protected getCategoryIcon(id: number): string {
		return (this.$group()?.categories
			.flatMap(category => category.subCategories)
			.find(subCategory => subCategory.id === id)
		?? DEFAULT_CATEGORY.subCategories[0]).icon;
	}

	protected noSort(): number {
		return 0;
	}
}
