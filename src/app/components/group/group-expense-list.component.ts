import { CommonModule } from "@angular/common";
import { Component, computed, inject, Input, input, OnInit } from "@angular/core";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { Store } from "@ngrx/store";
import {
	groupBy,
	map,
	mapKeys,
	mapValues,
	pick,
	pickBy,
	size
} from "lodash-es";

import { DEFAULT_CATEGORY } from "../../models/category.model";
import { Expense } from "../../models/expense.model";
import { Group, GroupType } from "../../models/group.model";
import { ExpenseAction } from "../../store/expense/expense.action";
import { ExpenseSelector } from "../../store/expense/expense.selector";
import { DateUtilities } from "../../utilities/date";

@Component({
	selector: "app-group-expense-list",
	standalone: true,
	imports: [
		CommonModule,
		MatDividerModule,
		MatIconModule,
		RouterLink
	],
	template: `
		@for (kvp of $expensesByMonth() | keyvalue: noSort; track kvp.key) {
			<div class="expense-record-container">
				<div class="month-group">{{ kvp.key | date: "MMMM yyyy" | uppercase }}</div>
				@for (expense of kvp.value; track expense.id) {
					<a class="expense-record" [routerLink]="['/group', group().id, 'expense', expense.id]">
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
						<mat-divider></mat-divider>
					}
				}
			</div>
		}
	`,
	styles: [`
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
	`]
})
export class GroupExpenseListComponent implements OnInit {
	private readonly store = inject(Store);

	private readonly $expenses = this.store.selectSignal(ExpenseSelector.selectAllExpenses);

	protected readonly $expensesByMonth = computed(() => {
		const members = pick(this.group().members ?? {}, this.group().memberIds ?? []);
		return mapValues(
			groupBy(this.$expenses(), e => DateUtilities.yearMonth(e.expenseDate)),
			es => es.map(e => ({
				...e, 
				paidBy: members[e.paidBy].name,
				usersShare: this.group().groupType === GroupType.ExpenseTracker 
					? {}
					: mapKeys(e.usersShare, (_value, key) => members[key].name)
			}))
		);
	});

	readonly group = input.required<Group>();

	@Input()
	set triggerOnScroll(value: boolean) {
		if(value) {
			this.store.dispatch(ExpenseAction.getNext({ groupId: this.group().id, initialGet: false }));
		}
	}

	ngOnInit(): void {
		if(!this.$expenses().length) {
			this.store.dispatch(ExpenseAction.getNext({ groupId: this.group().id, initialGet: true }));
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
		return (this.group()?.categories
			.flatMap(category => category.subCategories)
			.find(subCategory => subCategory.id === id)
		?? DEFAULT_CATEGORY.subCategories[0]).icon;
	}

	protected noSort(): number {
		return 0;
	}
}