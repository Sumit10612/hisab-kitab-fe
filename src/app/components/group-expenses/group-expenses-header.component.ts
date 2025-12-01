import { Component, input } from "@angular/core";
import {
    getGroupImage,
    GroupInfo,
    GroupType,
} from "../../models/group.model";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { DateUtilities } from "../../utilities/date";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";

@Component({
    selector: "app-group-expenses-header",
    standalone: true,
    imports: [
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        RouterLink,
        CommonModule,
    ],
    template: `
        @if (group(); as group) {
            <div class="header-section">
                <div class="header-section-page-info">
                    <img
                        width="50"
                        height="50"
                        [src]="getGroupImage(group.imageUrl).src"
                        [alt]="getGroupImage(group.imageUrl).alt"
                    />

                    <span class="header-section-page-info-name">{{
                        group.name
                    }}</span>

                    <a mat-icon-button [routerLink]="['/group', group.id]">
                        <mat-icon>settings</mat-icon>
                    </a>
                </div>

                <div class="header-section-group-info">
                    <div class="header-section-group-info-total">
                        <span class="header-section-group-info-total-amount">
                            &#8377;
                            {{
                                isExpenseTracker
                                    ? group.monthTotal[
                                          dateUtil.yearMonth(
                                              dateUtil.previousMonth()
                                          )
                                      ]
                                    : group.currentMember.paid
                            }}
                        </span>
                        <span class="label">{{
                            isExpenseTracker ? "last month" : "you paid"
                        }}</span>
                    </div>

                    <div class="header-section-group-info-month">
                        <span class="header-section-group-info-month-amount">
                            &#8377;
                            {{
                                isExpenseTracker
                                    ? group.monthTotal[dateUtil.yearMonth()] ||
                                      0
                                    : group.groupTotal
                            }}
                        </span>
                        <span class="label">{{
                            isExpenseTracker ? "this month" : "total balance"
                        }}</span>
                    </div>

                    <div class="header-section-group-info-total">
                        <span class="header-section-group-info-total-amount">
                            &#8377;
                            {{
                                isExpenseTracker
                                    ? group.groupTotal
                                    : group.currentMember.share
                                | number: "1.2"
                            }}
                        </span>
                        <span class="label">{{
                            isExpenseTracker ? "total" : "your share"
                        }}</span>
                    </div>
                </div>

                <div class="header-section-tab">
                    <mat-button-toggle-group
                        hideSingleSelectionIndicator="true"
                        [value]="page()"
                    >
                        <mat-button-toggle
                            value="expense"
                            [routerLink]="['/group', group.id, 'expenses']"
                            >Expense</mat-button-toggle
                        >
                        @if (!isExpenseTracker) {
                            <mat-button-toggle
                                value="balance"
                                [routerLink]="[
                                    '/group',
                                    group.id,
                                    'expenses',
                                    'balance',
                                ]"
                                >Balance</mat-button-toggle
                            >
                        }
                        <mat-button-toggle
                            value="summary"
                            [routerLink]="[
                                '/group',
                                group.id,
                                'expenses',
                                'summary',
                            ]"
                            >Summary</mat-button-toggle
                        >
                    </mat-button-toggle-group>
                </div>
            </div>
        }
    `,
    styles: [
        `
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

                .mat-button-toggle-group {
                    height: 32px;
                    border-radius: 16px;
                    align-items: center;
                }
            }
        `,
    ],
})
export class GroupExpensesHeaderComponent {
    protected readonly dateUtil = DateUtilities;
    protected readonly getGroupImage = getGroupImage;

    readonly group = input.required<GroupInfo>();
    readonly page = input.required<"expense" | "summary" | "balance">();

    protected get isExpenseTracker(): boolean {
        return this.group().groupType === GroupType.ExpenseTracker;
    }
}
