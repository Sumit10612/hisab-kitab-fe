import { CommonModule } from "@angular/common";
import { Component, inject, Input, OnInit } from "@angular/core";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";

import { DEFAULT_CATEGORY, SubCategory } from "../models/category.model";
import { DateOption, FilterCriteria } from "../models/filter-criteria.model";
import { Group } from "../models/group.model";
import { ExpenseService } from "../services/expense.service";
import { getEndOfMonth, getPreviousMonth, getStartOfMonth } from "../utilities/date";

import { FilterExpenseCriteriaComponent } from "./widgets/filter-expense-criteria.component";

@Component({
	selector: "app-expenses-summary",
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatDividerModule
	],
	template: `
		<div class="date-selection-section">
			<span>{{ filterCriteria?.fromDate | date: "dd/MMM/yy" }} - {{ filterCriteria?.toDate | date: "dd/MMM/yy" }}</span>
			<button mat-icon-button (click)="changeCriteria()">
				<mat-icon>tune</mat-icon>
			</button>
		</div>

		<div class="summary-container">
			@for (kvp of paidBySummary | keyvalue; track kvp) {
				<div class="summary-record">
					<span>{{kvp.key}}</span>
					<span>&#8377; {{kvp.value | number: '1.2-2'}}</span>
				</div>
				<mat-divider></mat-divider>
			}

			<div class="summary-record">
				<span>Total</span>
				<span>&#8377; {{totalAmount | number: '1.2-2'}}</span>
			</div>
		</div>

		<h4>Spends by Categories:</h4>
		<div class="summary-container">
			@if (hasData) {
				@for (kvp of expenseSummary | keyvalue; track kvp) {
					<div class="summary-record">
						<div class="summary-record-name">
							<span class="emojis">{{getCategoryById(+kvp.key).icon}}</span>
							<span>{{getCategoryById(+kvp.key).name}}</span>
						</div>
						<span>&#8377; {{kvp.value | number: '1.2-2'}}</span>
					</div>

					<mat-divider></mat-divider>
				}
			} @else {
				No data available for selected criteria.
			}
		</div>
	`,
	styles: [`
		.date-selection-section {
			display: flex;
			gap: 16px;
			justify-content: space-between;
			align-items: center;
		}

		.summary-container {
			margin: 16px 0;

			.summary-record {
				display: flex;
				justify-content: space-between;
				gap: 8px;

				&-name {
					display: flex;
					gap: 8px;
				}
			}

			> mat-divider {
				margin: 8px 0;
			}
		}
	`]
})
export class ExpensesSummaryComponent implements OnInit {
	private readonly bottomSheet = inject(MatBottomSheet);
	private readonly expenseService = inject(ExpenseService);

	protected filterCriteria?: FilterCriteria;
	protected expenseSummary: Record<number, number> = {};
	protected paidBySummary: Record<string, number> = {};
	protected totalAmount: number = 0;

	@Input() group?: Group;

	ngOnInit() {
		const today = new Date();
		this.filterCriteria = {
			dateOption: DateOption.Current,
			fromDate: getStartOfMonth(today),
			toDate: getEndOfMonth(today)
		};

		this.getExpenses();
	}

	protected changeCriteria() {
		this.bottomSheet.open(FilterExpenseCriteriaComponent, {
			disableClose: true,
			data: {
				criteria: { 
					dateOption: this.filterCriteria?.dateOption,
					fromDate: this.filterCriteria?.fromDate,
					toDate: this.filterCriteria?.toDate
				} as FilterCriteria
			}
		}).afterDismissed().subscribe(criteria => {
			if(criteria.dateOption !== this.filterCriteria?.dateOption) {
				this.filterCriteria = criteria;

				this.getExpenses();
			}
		});
	}

	protected getCategoryById(id: number): SubCategory {
		return (this.group?.categories
			.flatMap(category => category.subCategories)
			.find(subCategory => subCategory.id === id)
		?? DEFAULT_CATEGORY.subCategories[0]);
	}

	private async getExpenses() {
		const today = new Date();
		if(this.filterCriteria?.dateOption === DateOption.Current) {
			this.filterCriteria.fromDate = getStartOfMonth(today);
			this.filterCriteria.toDate = getEndOfMonth(today);
		} else if(this.filterCriteria?.dateOption === DateOption.Last) {
			const lastMonth = getPreviousMonth(today);
			this.filterCriteria.fromDate = getStartOfMonth(lastMonth);
			this.filterCriteria.toDate = getEndOfMonth(lastMonth);
		}

		if(!this.group?.id || !this.filterCriteria?.fromDate || !this.filterCriteria.toDate) {
			return;
		}

		const expenses = await this.expenseService.getByDateRange(
			this.group.id, 
			this.filterCriteria?.fromDate, 
			this.filterCriteria?.toDate
		);

		this.expenseSummary = {};
		this.paidBySummary = {};
		this.totalAmount = 0;
		expenses.forEach(expense => {
			if (expense.category) {
				if (!this.expenseSummary[expense.category]) {
					this.expenseSummary[expense.category] = 0;
				}

				this.expenseSummary[expense.category] += expense.amount;
			}

			const memberName = this.group?.members[expense.paidBy].name ?? "";
			if(!this.paidBySummary[memberName]) {
				this.paidBySummary[memberName] = 0;
			}

			this.paidBySummary[memberName] += expense.amount;
			this.totalAmount += expense.amount;
		});
	}

	get hasData() {
		return Object.keys(this.expenseSummary).length > 0;
	}
}