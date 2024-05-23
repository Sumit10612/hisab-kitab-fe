import { CommonModule } from "@angular/common";
import { Component, inject, Input, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { combineLatest, map, Observable } from "rxjs";

import { getCategoryById } from "../models/category.model";
import { Expense } from "../models/expense.model";
import { getGroupImage, Group, GroupMember } from "../models/group.model";
import { ExpenseService } from "../services/expense.service";
import { GroupService } from "../services/group.service";
import { getYearMonth } from "../utilities/date";

import { LayoutComponent } from "./shared/layout.component";
import { PageNavHeaderComponent } from "./shared/page-nav-header.component";
import { GroupWidgetComponent } from "./widgets/group-widget.component";

@Component({
	selector: "app-group-expesnse-detail",
	standalone: true,
	imports: [
		CommonModule,
		MatCardModule,
		MatButtonToggleModule,
		MatIconModule,
		MatButtonModule,
		PageNavHeaderComponent,
		GroupWidgetComponent,
		LayoutComponent,
		RouterLink,
		MatDividerModule
	],
	template: `
	<app-layout>
		<div section="header" class="header-section">
		<app-page-nav-header
			backRoute="/home" 
			[title]="group?.name"
			[template]="settingsRouteTemplate">
		</app-page-nav-header>

		<div class="header-section-group-info">
			@if (group) {
			<img
				width="50"
				height="50"
				[src]="getGroupImage(group.imageUrl).src"
				[alt]="getGroupImage(group.imageUrl).alt" />
			
			<div class="header-section-group-info-month">
				<span class="header-section-group-info-month-amount">
				&#8377; {{getCurrentMonthTotal}}
				</span>
				<span class="header-section-group-info-month-label">this month</span>
			</div>

			<div class="header-section-group-info-total">
				<span class="header-section-group-info-total-amount">
				&#8377; {{group.groupTotal}}
				</span>
				<span class="header-section-group-info-total-label">total</span>
			</div>
			}
		</div>

		<div class="header-section-tab">
			<mat-button-toggle-group
				[(value)]="selectedTab"
				hideSingleSelectionIndicator="true"
				>
				<mat-button-toggle value="expense">Expense</mat-button-toggle>
				<mat-button-toggle value="summary">Summary</mat-button-toggle>
			</mat-button-toggle-group>
		</div>
		</div>

		<div section="detail" class="detail-section">
		<mat-card-content>
			@if (selectedTab === "expense") {
				<div class="expenses-area">
					@for (kvp of expenses$ | async | keyvalue: noSort; track kvp) {
					<div class="expense-record-container">
						<div class="month-group">{{ kvp.key | date: "MMMM yyyy" | uppercase }}</div>
						@for (expense of kvp.value; track expense) {
						<a class="expense-record" [routerLink]="['/group', group?.id, 'expense', expense.id]">
							<span class="expense-date">
							<span class="expense-date-month">{{expense.expenseDate | date: "MMM" | uppercase}}</span>
							<span class="expense-date-date">{{expense.expenseDate | date: "dd"}}</span>
							</span>
							<mat-icon>{{getCategory(expense?.category ?? 0)?.icon}}</mat-icon>
							<span class="expense-desc">
							<span>{{expense.description}}</span>
							@if (expense.where) {
								<span class="expense-desc-where">at {{expense.where}}</span>
							}
							</span>
							<span class="expense-amount">
							<span class="expense-amount-paid-by">{{expense.paidBy.split(' ')[0]}} paid</span>
								&#8377;
								{{expense.amount}}
							</span>
						</a>
						@if ($index !== kvp.value.length - 1) {
							<mat-divider></mat-divider>
						}
						}
					</div>
					}
				</div>
			} @else {
				Summary
			}
		</mat-card-content>
		</div>
	</app-layout>

	<div class="add-expense-button">
		<a mat-fab color="warn"
		role="button"
		[routerLink]="['/group', group?.id, 'expense']"
		[disabled]="!group?.id">
			<mat-icon>add</mat-icon>
		</a>
	</div>

	<ng-template #settingsRouteTemplate>
		<a role="button" 
			mat-icon-button
			[routerLink]="['/group', group?.id]"
			[disabled]="!group?.id">
			<mat-icon>tune</mat-icon>
		</a>
	</ng-template>
	`,
	styles: [`
	.header-section {
		margin: -16px;
		padding: 16px 16px 0 16px;

		&-group-info {
			margin: 0 16px;
			display: flex;
			gap: 16px;

			&-month {
				display: flex;
				flex-direction: column;
				text-align: center;
				margin: auto;
				gap: 8px;

				&-amount {
					font-size: 24px;
				}

				&-label {
					font-size: 12px;
				}
			}

			&-total {
				display: flex;
				flex-direction: column;
				text-align: center;
				margin-left: auto;

				&-label {
					font-size: 12px;
				}

				&-amount {
					font-size: 16px;
				}
			}
		}

		&-tab {
			margin-top: 16px;
			text-align: center;
		}
	}

	.detail-section {
		height: calc(100vh - 176px);
		overflow-y: auto;
	}

	.mat-button-toggle-group {
		border-radius: 16px;
	}

	.mat-button-toggle-group {
		height: 32px;
		align-items: center;
	}

	.expense-record-container {
		margin-bottom: 16px;

		.month-group {
			font-weight: 500;
			font-size: 0.9rem;
			margin: 8px 0;
		}

		> mat-divider {
			margin: 8px 16px;
		}

		.expense-record {
			text-decoration: none;
			color: inherit;
			display: grid;
			grid-template-columns: 0.5fr 0.5fr 3fr 1fr;
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

	.add-expense-button {
		position: absolute;
		right: 16px;
		bottom: 16px;
	}
	`]
})
export class GroupExpenseDetailComponent implements OnInit {
	private readonly groupService = inject(GroupService);
	private readonly expenseService = inject(ExpenseService);

	protected expenses$: Observable<Record<string, Expense[]>> | undefined;
	protected group: Group | undefined;
	protected getGroupImage = getGroupImage;
	protected selectedTab: string = "expense";
	protected getCategory = getCategoryById;

	@Input() id: string = "";

	ngOnInit() {
		this.expenses$ = combineLatest([
			this.groupService.get$(this.id),
			this.expenseService.getAll$(this.id)
		]).pipe(
			map(([group, expenses]) => {
				this.group = group;

				const members = group.members.reduce((acc, member) => {
					acc[member.id] = member;
					return acc;
				}, {} as Record<string, GroupMember>);

				return expenses.reduce((acc, e) => {
					const key = getYearMonth(e.expenseDate);
					acc[key] = acc[key] || [];
					acc[key].push({ ...e, paidBy: members[e.paidBy].name } as Expense);
					return acc;
				}, {} as Record<string, Expense[]>);
			})
		);
	}

	get getCurrentMonthTotal() {
		const currentMonth = getYearMonth(new Date());
		return this.group?.monthTotal[currentMonth] ?? 0;
	}

	noSort() {
		return 0;
	}
}
