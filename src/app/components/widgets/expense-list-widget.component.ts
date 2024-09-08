import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

import { getCategoryById } from "../../models/category.model";
import { Expense } from "../../models/expense.model";

@Component({
	selector: "app-expense-list",
	standalone: true,
	imports: [
		CommonModule,
		MatDividerModule,
		MatIconModule,
		RouterLink
	],
	template: `
		@for (kvp of expensesByMonth | keyvalue: noSort; track kvp) {
			<div class="expense-record-container">
				<div class="month-group">{{ kvp.key | date: "MMMM yyyy" | uppercase }}</div>
				@for (expense of kvp.value; track expense) {
					<a class="expense-record" [routerLink]="['/group', groupId, 'expense', expense.id]">
						<span class="expense-date">
							<span class="expense-date-month">{{expense.expenseDate | date: "MMM" | uppercase}}</span>
							<span class="expense-date-date">{{expense.expenseDate | date: "dd"}}</span>
						</span>
						<span class="emojis">{{getCategory(expense?.category ?? 0)?.icon}}</span>
						<span class="expense-desc">
							<span>{{expense.description}}</span>
							@if (expense.where) {
							<span class="expense-desc-where">at {{expense.where}}</span>
							}
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
export class ExpenseListComponent {
	protected getCategory = getCategoryById;

	protected noSort() {
		return 0;
	}

	@Input() groupId?: string;
	@Input() expensesByMonth?: Record<string, Expense[]> | null;
}