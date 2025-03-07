import { Component, Inject, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";

import { DateOption, FilterCriteria } from "../../models/filter-criteria.model";
import { DateUtilities } from "../../utilities/date";

@Component({
	selector: "app-filter-expense-criteria",
	standalone: true,
	imports: [
		FormsModule,
		MatButtonModule,
		MatRadioModule,
		MatDatepickerModule,
		MatInputModule,
		MatFormFieldModule
	],
	providers: [provideNativeDateAdapter()],
	template: `
		<div class="filter-container">
			<div>
				<mat-radio-group [(ngModel)]="data.criteria.dateOption">
					<mat-radio-button [value]="dateOption.Current">This Month</mat-radio-button>
					<mat-radio-button [value]="dateOption.Last">Last Month</mat-radio-button>
					<mat-radio-button [value]="dateOption.Custom">Custom</mat-radio-button>
				</mat-radio-group>
			</div>

			<div>
				@if (data.criteria.dateOption === dateOption.Custom) {
					<mat-form-field>
						<input matInput [matDatepicker]="fromDp" [(ngModel)]="data.criteria.fromDate">
						<mat-datepicker-toggle matIconSuffix [for]="fromDp"></mat-datepicker-toggle>
						<mat-datepicker #fromDp></mat-datepicker>
					</mat-form-field>

					<mat-form-field>
						<input matInput [matDatepicker]="toDp" [(ngModel)]="data.criteria.toDate">
						<mat-datepicker-toggle matIconSuffix [for]="toDp"></mat-datepicker-toggle>
						<mat-datepicker #toDp></mat-datepicker>
					</mat-form-field>
				}
			</div>

			<div class="btn-group">
				<button mat-raised-button
					class="rounded" 
					color="primary" 
					(click)="close()">Apply
				</button>
			</div>
		</div>
	`,
	styles: [`
		.filter-container {
			display: flex;
			flex-direction: column;
			gap: 16px;
			height: 100%;
		}

		.btn-group {
			display: flex;
			gap: 16px;
			justify-content: space-between;

			> button {
				border-radius: 16px;
				width: 100%;
			}
		}
	`]
})
export class FilterExpenseCriteriaComponent {
	private readonly bottomSheet = inject(MatBottomSheetRef<FilterExpenseCriteriaComponent>);

	private readonly dateUtil = DateUtilities;

	dateOption = DateOption;

	constructor(
		@Inject(MAT_BOTTOM_SHEET_DATA) protected data: {
			criteria: FilterCriteria;
		}) {}

	close() {
		if(this.data.criteria.dateOption === DateOption.Current) {
			this.data.criteria.fromDate = this.dateUtil.startOfMonth();
			this.data.criteria.toDate = this.dateUtil.endOfMonth();
		} else if(this.data.criteria.dateOption === DateOption.Last) {
			const date = this.dateUtil.previousMonth();
			this.data.criteria.fromDate = this.dateUtil.startOfMonth(date);
			this.data.criteria.toDate = this.dateUtil.endOfMonth(date);
		}

		this.bottomSheet.dismiss(this.data.criteria);
	}
}