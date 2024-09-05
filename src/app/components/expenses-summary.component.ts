import { CommonModule } from "@angular/common";
import { Component, inject, Input, OnInit } from "@angular/core";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { DateOption, FilterCriteria } from "../models/filter-criteria.model";
import { ExpenseService } from "../services/expense.service";
import { getEndOfMonth, getPreviousMonth, getStartOfMonth } from "../utilities/date";

import { FilterExpenseCriteriaComponent } from "./widgets/filter-expense-criteria.component";


@Component({
	selector: "app-expenses-summary",
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule
	],
	template: `
		<div class="date-selection-section">
			{{ filterCriteria?.fromDate | date: "dd/MMM/yy" }} - {{ filterCriteria?.toDate | date: "dd/MMM/yy" }}
			<button mat-icon-button (click)="changeCriteria()">
				<mat-icon>tune</mat-icon>
			</button>
		</div>
	`,
	styles: [`
		.date-selection-section {
			display: flex;
			gap: 16px;
			justify-content: space-between;
			align-items: center;
		}
	`]
})
export class ExpensesSummaryComponent implements OnInit {
	private readonly bottomSheet = inject(MatBottomSheet);
	private readonly expenseService = inject(ExpenseService);

	protected filterCriteria?: FilterCriteria;

	@Input() groupId?: string;

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

		if(!this.groupId || !this.filterCriteria?.fromDate || !this.filterCriteria.toDate) {
			return;
		}

		const expenses = await this.expenseService.getByDateRange(
			this.groupId, 
			this.filterCriteria?.fromDate, 
			this.filterCriteria?.toDate
		);

		console.log(expenses);
	}
}