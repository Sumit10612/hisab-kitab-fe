import { CommonModule } from "@angular/common";
import { Component, computed, inject, input, OnInit } from "@angular/core";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { Category, DEFAULT_CATEGORY } from "../../models/category.model";
import { DateOption, FilterCriteria } from "../../models/filter-criteria.model";
import { ExpenseService } from "../../store/expense/expense.service";
import { DateUtilities } from "../../utilities/date";
import { DividerComponent } from "../shared/divider.component";
import { FilterExpenseCriteriaComponent } from "../widgets/filter-expense-criteria.component";
import { Store } from "@ngrx/store";
import { GroupSelector } from "../../store/group/group.selector";
import { LayoutComponent } from "../shared/layout.component";
import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { ToolbarButtonType } from "../../models/toolbar.model";
import { GroupExpensesHeaderComponent } from "./group-expenses-header.component";

@Component({
	selector: "app-group-expenses-summary",
	standalone: true,
	imports: [
		CommonModule,
		GroupExpensesHeaderComponent,
		MatButtonModule,
		MatIconModule,
		DividerComponent,
		LayoutComponent
	],
	template: `
		<app-layout [headerHeight]="'160px'">
			<div section="header">
				@if ($group(); as group) {
					<app-group-expenses-header [group]="group" page="summary"></app-group-expenses-header>
				}
			</div>
			<div section="detail">
			<div class="date-selection-section">
			<span>{{ filterCriteria?.fromDate | date: "dd/MMM/yy" }} - {{ filterCriteria?.toDate | date: "dd/MMM/yy" }}</span>
		</div>

		<div class="summary-container">
			@for (kvp of paidBySummary | keyvalue; track kvp.key) {
				<div class="summary-record">
					<span>{{kvp.key}}</span>
					<span>&#8377; {{kvp.value | number: '1.2-2'}}</span>
				</div>
				<app-divider></app-divider>
			}

			<div class="summary-record">
				<span>Total</span>
				<span>&#8377; {{totalAmount | number: '1.2-2'}}</span>
			</div>
		</div>

			<h4>Spends by Categories:</h4>
			<div class="summary-container">
				@if (hasData) {
					@for (kvp of expenseTotalByCategory | keyvalue; track kvp.key) {
						<div class="summary-record category">
							<div class="summary-record-name">
								<span>{{getCategoryById(+kvp.key).name}}</span>
							</div>
							<span>&#8377; {{kvp.value | number: '1.2-2'}}</span>
						</div>
						<app-divider></app-divider>

						@for (subCategory of getCategoryById(+kvp.key).subCategories; track subCategory.id) {
								@if (expenseTotalBySubCategory[subCategory.id]) {
									<div class="summary-record sub-category">
										<div class="summary-record-name">
											<span class="emojis">{{subCategory.icon}}</span>
											<span>{{subCategory.name}}</span>
										</div>
										<span>&#8377; {{expenseTotalBySubCategory[subCategory.id] | number: '1.2-2'}}</span>
									</div>
									<app-divider></app-divider>
								}
							}
						}
					} @else {
						No data available for selected criteria.
					}
				</div>
			</div>
		</app-layout>
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

			.category {
				font-weight: 600;
			}

			.sub-category {
				margin-left: 16px;
			}
		}
	`]
})
export class GroupExpensesSummaryComponent implements OnInit {
	private readonly bottomSheet = inject(MatBottomSheet);
	private readonly expenseService = inject(ExpenseService);
	private readonly store = inject(Store);
	private readonly toolbar = inject(ToolbarConfigurationService);

	protected filterCriteria?: FilterCriteria;
	protected paidBySummary: Record<string, number> = {};
	protected totalAmount: number = 0;
	protected expenseTotalByCategory: Record<number, number> = {};
	protected expenseTotalBySubCategory: Record<number, number> = {};

	protected readonly groupId = input.required<string>();
	protected readonly $group = computed(() => this.store.selectSignal(GroupSelector.selectGroup(this.groupId()))());

	ngOnInit() {
		this.toolbar.configure({
			back: { visible: () => true },
			actionBtns: [
				{
					type: ToolbarButtonType.Secondary,
					icon: "tune",
					action: () => {
						this.bottomSheet.open(FilterExpenseCriteriaComponent, {
							data: {
								criteria: { 
									dateOption: this.filterCriteria?.dateOption,
									fromDate: this.filterCriteria?.fromDate,
									toDate: this.filterCriteria?.toDate
								} as FilterCriteria
							}
						}).afterDismissed().subscribe((criteria?: FilterCriteria) => {
							if(criteria && criteria.dateOption !== this.filterCriteria?.dateOption) {
								this.filterCriteria = criteria;				
								this.getExpenses(criteria.fromDate, criteria.toDate);
							}
						});
					}
				}
			]
		});

		const today = new Date();
		this.filterCriteria = {
			dateOption: DateOption.Current,
			fromDate: DateUtilities.startOfMonth(today),
			toDate: DateUtilities.endOfMonth(today)
		};

		this.getExpenses(DateUtilities.startOfMonth(today), DateUtilities.endOfMonth(today));
	}

	protected getCategoryById(id: number): Category {
		return this.$group()?.categories.find(category => category.id === id)
			?? DEFAULT_CATEGORY;
	}

	private async getExpenses(fromDate: Date, toDate: Date) {
		const expenses = await this.expenseService.getByDateRange(this.groupId(), fromDate, toDate);

		this.expenseTotalByCategory = {};
		this.paidBySummary = {};
		this.totalAmount = 0;
		expenses.forEach(expense => {
			const categoryId = this.$group()?.categories
				.find(category => category.subCategories.some(sc => sc.id === expense.category))?.id;
			if (categoryId && expense.category) {
				this.expenseTotalByCategory[categoryId] ??= 0;
				this.expenseTotalByCategory[categoryId] += expense.amount;

				this.expenseTotalBySubCategory[expense.category] ??= 0;
				this.expenseTotalBySubCategory[expense.category] += expense.amount;
			}

			const memberName = this.$group()?.members[expense.paidBy].name ?? "";
			this.paidBySummary[memberName] ??= 0;
			this.paidBySummary[memberName] += expense.amount;
			this.totalAmount += expense.amount;
		});
	}

	get hasData() {
		return Object.keys(this.expenseTotalByCategory).length > 0;
	}
}