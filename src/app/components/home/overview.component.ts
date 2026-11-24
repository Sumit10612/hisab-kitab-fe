import { Component, computed, input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { sumBy } from "lodash-es";

import { GroupInfo, GroupType } from "../../models/group.model";
import { DateUtilities } from "../../utilities/date";
import { CommonModule } from "@angular/common";

@Component({
    selector: "app-overview",
    imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule],
    template: `
        <div
            class="overview-widget"
            [class.investment]="mode() === 'investment'"
        >
            <mat-card>
                <mat-card-content>
                    @if (mode() === "investment") {
                        <div class="invested">
                            <span class="invested-total"
                                >&#8377;
                                {{ investedTotal() | number: "1.0-0" }}</span
                            >
                            <span class="invested-text">total invested</span>
                        </div>
                    } @else {
                        <div class="split-expenses">
                            <div class="split-expenses-header">
                                <span class="split-expenses-header-total"
                                    >&#8377;
                                    {{
                                        splitExpenseTotal() | number: "1.0-0"
                                    }}</span
                                >
                                <span class="split-expenses-header-text"
                                    >total balance</span
                                >
                            </div>
                            <mat-divider></mat-divider>
                            <div class="split-expenses-detail">
                                <div>
                                    <span class="split-expenses-detail-owe"
                                        >&#8377; 0</span
                                    >
                                    <span>you owe</span>
                                </div>
                                <div>
                                    <span class="split-expenses-detail-owed"
                                        >&#8377; 0</span
                                    >
                                    <span>you are owed</span>
                                </div>
                            </div>
                        </div>
                        <mat-divider vertical></mat-divider>
                        <div class="expense-tracker">
                            <div class="expense-tracker-header">
                                <span class="expense-tracker-header-total"
                                    >&#8377;
                                    {{
                                        expenseTrackerTotal() | number: "1.0-0"
                                    }}</span
                                >
                                <span class="expense-tracker-header-text"
                                    >this month</span
                                >
                            </div>
                        </div>
                    }
                </mat-card-content>
            </mat-card>
        </div>
    `,
    styles: [
        `
            .overview-widget {
                border-radius: 32px;

                .mat-mdc-card {
                    border-radius: 32px;
                    padding: 0 16px;

                    .mat-mdc-card-content {
                        display: flex;
                        justify-content: space-between;
                    }
                }

                &.investment {
                    height: 136px;

                    .mat-mdc-card {
                        height: 100%;
                        box-sizing: border-box;
                    }

                    .mat-mdc-card-content {
                        height: 100%;
                        padding: 0;
                        align-items: center;
                    }
                }
            }

            .split-expenses {
                display: flex;
                flex-direction: column;

                &-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    margin-bottom: 8px;

                    &-total {
                        font-size: 1.5rem;
                        font-weight: 500;
                    }
                }

                &-detail {
                    display: flex;
                    flex-direction: column;
                    margin-top: 8px;

                    &-owe {
                        margin-right: 4px;
                        font-weight: 500;
                        font-size: 1.1rem;
                        color: red;
                    }

                    &-owed {
                        margin-right: 4px;
                        font-weight: 500;
                        font-size: 1.1rem;
                        color: green;
                    }
                }
            }

            .expense-tracker {
                display: flex;
                justify-content: center;
                align-items: center;

                &-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;

                    &-total {
                        font-size: 1.5rem;
                        font-weight: 500;
                    }
                }
            }
            .invested {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                width: 100%;

                &-total {
                    font-size: 1.8rem;
                    font-weight: 500;
                }
            }
        `,
    ],
})
export class OverviewComponent {
    readonly groups = input<GroupInfo[]>([]);
    readonly mode = input<"groups" | "investment">("groups");
    readonly investedTotal = input(0);

    protected readonly expenseTrackerTotal = computed(() => {
        const currMonth = DateUtilities.yearMonth();
        return sumBy(this.groups(), (group) =>
            group.groupType === GroupType.ExpenseTracker && !group.excludeTotal
                ? +group.monthTotal[currMonth] || 0
                : 0,
        );
    });

    protected readonly splitExpenseTotal = computed(() => {
        return sumBy(this.groups(), (group) =>
            group.groupType === GroupType.SpiltExpense && !group.excludeTotal
                ? +group.groupTotal || 0
                : 0,
        );
    });
}
