import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, RouterLink } from "@angular/router";
import {
	fromPairs,
	groupBy,
	sortBy,
	toPairs
} from "lodash";
import { combineLatest, map, switchMap } from "rxjs";

import { getCategoryById } from "../models/category.model";
import { Expense } from "../models/expense.model";
import { getGroupImage } from "../models/group.model";
import { GroupExpenseService } from "../services/group-expense.service";
import { GroupService } from "../services/group.service";
import { UserService } from "../services/user.service";

import { LayoutComponent } from "./shared/layout.component";
import { PageNavHeaderComponent } from "./shared/page-nav-header.component";
import { GroupWidgetComponent } from "./widgets/group-widget.component";

@Component({
	selector: "app-group-editor",
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
            [title]="$group()?.name"
            [template]="settingsRouteTemplate">
        </app-page-nav-header>

        <div class="header-section-group-info">
            @if ($group()) {
                <img
                    width="50"
                    height="50"
                    [src]="getGroupImage($group()?.imageUrl).src"
                    [alt]="getGroupImage($group()?.imageUrl).alt" />
                
                <h2>Total Balance &#8377;{{$group()?.groupTotalAmount ?? 0}}</h2>
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
                  @for (kvp of $expenses() | keyvalue; track kvp) {
                    <div class="expense-record-container">
                      <div class="month-group">{{ kvp.key | date: "MMMM yyyy" | uppercase }}</div>
                      @for (expense of kvp.value; track expense) {
                        <a class="expense-record" [routerLink]="['/group', $group()?.uid, 'expense', expense.uid]">
                          <span class="expense-date">
                            <span class="expense-date-month">{{expense.expenseDate | date: "MMM" | uppercase}}</span>
                            <span class="expense-date-date">{{expense.expenseDate | date: "dd"}}</span>
                          </span>
                          <mat-icon>{{getCategory(expense?.category ?? 0)?.icon}}</mat-icon>
                          {{expense.description}}
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
        [routerLink]="['/group', $group()?.uid, 'expense']"
        [disabled]="!$group()?.uid">
          <mat-icon>add</mat-icon>
      </a>
    </div>

    <ng-template #settingsRouteTemplate>
        <a role="button" 
          mat-icon-button
          [routerLink]="['/group', $group()?.uid, 'settings']"
          [disabled]="!$group()?.uid">
            <mat-icon>settings</mat-icon>
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
export class GroupEditorComponent {
	private readonly userService = inject(UserService);
	private readonly groupService = inject(GroupService);
	private readonly groupExpenseService = inject(GroupExpenseService);
	private readonly route = inject(ActivatedRoute);

	private group$ = this.route.paramMap.pipe(
		switchMap(params => this.groupService.currentGroup$(params.get("id") ?? ""))
	);
	private expenses$ = combineLatest([
		this.userService.user$,
		this.group$,
		this.route.paramMap.pipe(
			switchMap(params => this.groupExpenseService.getGroupExpenses$(params.get("id") ?? ""))
		)
	]).pipe(
		map(([user, group, expenses]) => {
			const groupExpenses = groupBy(
				expenses.map(expense => {
					return {
						...expense,
						paidBy: expense.paidBy === user?.uid ? "you" : group.users.find(user => user.uid === expense.paidBy)?.name 
					} as Expense;
				}),
				expense => new Date(
					expense.expenseDate.getFullYear(),
					expense.expenseDate.getMonth(),
					1
				).getTime()
			);

			return fromPairs(sortBy(toPairs(groupExpenses), ([key, _]) => key));
		})
	);

	protected $group = toSignal(this.group$);
	protected $expenses = toSignal(this.expenses$);
	protected getGroupImage = getGroupImage;
	protected selectedTab: string = "expense";
	protected getCategory = getCategoryById;
}
