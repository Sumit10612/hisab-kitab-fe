import {
	Component,
	ElementRef,
	inject,
	Input,
	OnDestroy,
	OnInit,
	ViewChild
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterLink } from "@angular/router";
import { Store } from "@ngrx/store";
import { groupBy, mapValues, pick } from "lodash-es";
import { combineLatest, Subscription, tap } from "rxjs";

import { Expense } from "../models/expense.model";
import { getGroupImage, Group } from "../models/group.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { ExpenseAction } from "../store/expense/expense.action";
import { ExpenseSelector } from "../store/expense/expense.selector";
import { GroupSelector } from "../store/group/group.selector";
import { getPreviousMonth, getYearMonth } from "../utilities/date";

import { LayoutComponent } from "./shared/layout.component";
import { ExpenseListComponent } from "./widgets/expense-list-widget.component";

@Component({
	selector: "app-group-expesnse-detail",
	standalone: true,
	imports: [
		MatButtonToggleModule,
		MatButtonModule,
		MatIconModule,
		LayoutComponent,
		MatProgressSpinnerModule,
		ExpenseListComponent,
		RouterLink
	],
	template: `
		<app-layout headerHeight="160px">
			<div section="header" class="header-section">
				<div class="header-section-page-info">
					<img width="50" height="50" [src]="getGroupImage(group?.imageUrl).src"
						[alt]="getGroupImage(group?.imageUrl).alt" />
					
					<span class="header-section-page-info-name">{{group?.name}}</span>

					<a mat-icon-button [routerLink]="['/group', id]">
						<mat-icon>settings</mat-icon>
					</a>
				</div>
				<div class="header-section-group-info">
					<div class="header-section-group-info-total">
						<span class="header-section-group-info-total-amount">
							&#8377; {{lastMonthTotal}}
						</span>
						<span class="label">last month</span>
					</div>

					<div class="header-section-group-info-month">
						<span class="header-section-group-info-month-amount">
							&#8377; {{currentMonthTotal}}
						</span>
						<span class="label">this month</span>
					</div>

					<div class="header-section-group-info-total">
						<span class="header-section-group-info-total-amount">
							&#8377; {{group?.groupTotal}}
						</span>
						<span class="label">total</span>
					</div>
				</div>

				<div class="header-section-tab">
					<mat-button-toggle-group [(value)]="selectedTab" hideSingleSelectionIndicator="true">
						<mat-button-toggle value="expense">Expense</mat-button-toggle>
						<mat-button-toggle value="summary">Summary</mat-button-toggle>
					</mat-button-toggle-group>
				</div>
			</div>

			<div section="detail" class="detail-section" #scrollContainer (scroll)="onScroll()">
				@if (selectedTab === "expense") {
					<app-expense-list [groupId]="id" [expensesByMonth]="groupedExpenses"></app-expense-list>
				} @else {
					Summary
				}

				@if(loading) {
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
export class GroupExpenseDetailComponent implements OnInit, OnDestroy {
	@ViewChild("scrollContainer", { static: false }) scrollContainer: ElementRef | undefined;

	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly store = inject(Store);

	private expenses$$?: Subscription;

	protected groupedExpenses?: Record<string, Expense[]>;
	protected group: Group | undefined;
	protected getGroupImage = getGroupImage;
	protected selectedTab: string = "expense";
	protected loading = false;

	@Input() id: string = "";

	ngOnInit() {
		this.toolbar.configure({
			back: { visible: true },
			actionBtns: [
				{
					type: ToolbarButtonType.Primary,
					label: "Add expense",
					disabled: () => !this.id,
					redirectTo: ["/group", this.id, "expense"]
				}
			]
		});

		const group$ = this.store.select(GroupSelector.select(this.id)).pipe(
			tap(group => {
				this.group = group;
				this.store.dispatch(ExpenseAction.getNext({ groupId: this.id, initialGet: true }));
			})
		);

		this.expenses$$ = combineLatest([
			group$,
			this.store.select(ExpenseSelector.selectAll()),
			this.store.select(ExpenseSelector.isLoading)
		]).subscribe(([group, expenses, isLoading]) => {
			this.loading = isLoading;
			if (group?.memberIds.length) {
				const members = pick(group.members, group.memberIds);
				this.groupedExpenses = mapValues(
					groupBy(expenses, e => getYearMonth(e.expenseDate)),
					es => es.map(e => ({ ...e, paidBy: members[e.paidBy].name }))
				);
			}
		});
	}

	ngOnDestroy(): void {
		this.expenses$$?.unsubscribe();
	}

	protected get currentMonthTotal() {
		const currentMonth = getYearMonth(new Date());
		return this.group?.monthTotal[currentMonth] ?? 0;
	}

	protected get lastMonthTotal() {
		const lastMonth = getPreviousMonth(new Date());
		return this.group?.monthTotal[getYearMonth(lastMonth)] ?? 0;
	}

	protected onScroll() {
		if (this.loading || !this.scrollContainer?.nativeElement.scrollTop) {
			return;
		}

		const element = this.scrollContainer.nativeElement;
		if (element.scrollHeight - element.clientHeight <= element.scrollTop + 1) {
			this.store.dispatch(ExpenseAction.getNext({ groupId: this.id, initialGet: false }));
		}
	}
}
