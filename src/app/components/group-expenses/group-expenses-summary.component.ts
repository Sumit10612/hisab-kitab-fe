import { CommonModule } from "@angular/common";
import {
    Component,
    computed,
    effect,
    inject,
    input,
    OnInit,
} from "@angular/core";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { Category, DEFAULT_CATEGORY } from "../../models/category.model";
import { DateOption, FilterCriteria } from "../../models/filter-criteria.model";
import { DateUtilities } from "../../utilities/date";
import { DividerComponent } from "../shared/divider.component";
import { FilterExpenseCriteriaComponent } from "../widgets/filter-expense-criteria.component";
import { Store } from "@ngrx/store";
import { GroupSelector } from "../../store/group/group.selector";
import { LayoutComponent } from "../shared/layout.component";
import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { GroupExpensesHeaderComponent } from "./group-expenses-header.component";
import { Expense } from "../../models/expense.model";
import { ExpenseAction } from "../../store/expense/expense.action";
import { ExpenseSelector } from "../../store/expense/expense.selector";
import { GroupInfo } from "../../models/group.model";
import { flatMap, fromPairs } from "lodash-es";
import { RouterLink } from "@angular/router";
import { GroupAction } from "../../store/group/group.action";
import { NotificationService } from "../../services/notification.service";

@Component({
    selector: "app-group-expenses-summary",
    imports: [
        CommonModule,
        GroupExpensesHeaderComponent,
        MatButtonModule,
        MatIconModule,
        DividerComponent,
        LayoutComponent,
        RouterLink,
    ],
    template: `
        <app-layout [headerHeight]="'160px'">
            <div section="header">
                @if ($group(); as group) {
                    <app-group-expenses-header
                        [group]="group"
                        page="summary"
                    ></app-group-expenses-header>
                }
            </div>
            <div section="detail">
                <div class="date-selection-section">
                    <span
                        >{{ $filterCriteria()?.fromDate | date: "dd/MMM/yy" }} -
                        {{
                            $filterCriteria()?.toDate | date: "dd/MMM/yy"
                        }}</span
                    >
                </div>

                <div class="summary-container">
                    @for (kvp of paidBySummary | keyvalue; track kvp.key) {
                        <div class="summary-record">
                            <span>{{ kvp.key }}</span>
                            <span
                                >&#8377; {{ kvp.value | number: "1.2-2" }}</span
                            >
                        </div>
                        <app-divider></app-divider>
                    }

                    <div class="summary-record">
                        <span>Total</span>
                        <span>&#8377; {{ totalAmount | number: "1.2-2" }}</span>
                    </div>
                </div>

                <h4>Spends by Categories:</h4>
                <div class="summary-container">
                    @if (hasData) {
                        @for (
                            kvp of expenseTotalByCategory | keyvalue;
                            track kvp.key
                        ) {
                            <div
                                class="summary-record"
                                (click)="toggleExpandCategory(+kvp.key)"
                                [ngClass]="{
                                    highlight:
                                        $expandedCategoryId() === +kvp.key,
                                }"
                            >
                                <div class="summary-record-name">
                                    <span>{{
                                        getCategoryById(+kvp.key).name
                                    }}</span>
                                </div>
                                <span
                                    >&#8377;
                                    {{ kvp.value | number: "1.2-2" }}</span
                                >
                            </div>
                            <app-divider></app-divider>

                            @if ($expandedCategoryId() === +kvp.key) {
                                @for (
                                    subCategory of getCategoryById(+kvp.key)
                                        .subCategories;
                                    track subCategory.id
                                ) {
                                    @if (
                                        expenseTotalBySubCategory[
                                            subCategory.id
                                        ]
                                    ) {
                                        <div
                                            class="summary-record sub-category"
                                            (click)="
                                                toggleExpandSubCategory(
                                                    subCategory.id
                                                )
                                            "
                                            [ngClass]="{
                                                highlight:
                                                    $expandedSubCategoryId() ===
                                                    subCategory.id,
                                            }"
                                        >
                                            <div class="summary-record-name">
                                                <span class="emojis">{{
                                                    subCategory.icon
                                                }}</span>
                                                <span>{{
                                                    subCategory.name
                                                }}</span>
                                            </div>
                                            <span
                                                >&#8377;
                                                {{
                                                    expenseTotalBySubCategory[
                                                        subCategory.id
                                                    ] | number: "1.2-2"
                                                }}</span
                                            >
                                        </div>
                                        <app-divider></app-divider>

                                        @if (
                                            $expandedSubCategoryId() ===
                                            subCategory.id
                                        ) {
                                            @for (
                                                expense of expensesBySubCategory[
                                                    subCategory.id
                                                ];
                                                track expense.id
                                            ) {
                                                <a
                                                    class="summary-record expense"
                                                    [routerLink]="[
                                                        '/group',
                                                        groupId(),
                                                        'expense',
                                                        expense.id,
                                                    ]"
                                                >
                                                    <div
                                                        class="summary-record-name"
                                                    >
                                                        <span>{{
                                                            expense.expenseDate
                                                                | date
                                                                    : "dd/MM/yy"
                                                        }}</span>
                                                        <span>{{
                                                            expense.description
                                                        }}</span>
                                                    </div>

                                                    <span
                                                        >&#8377;
                                                        {{
                                                            expense.amount
                                                                | number
                                                                    : "1.2-2"
                                                        }}</span
                                                    >
                                                </a>

                                                <app-divider></app-divider>
                                            }
                                        }
                                    }
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
    styles: [
        `
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

                .sub-category {
                    margin-left: 16px;
                }

                .expense {
                    margin-left: 32px;
                    text-decoration: none;
                    color: inherit;
                }

                .highlight {
                    font-weight: 600;
                }
            }
        `,
    ],
})
export class GroupExpensesSummaryComponent implements OnInit {
    private readonly bottomSheet = inject(MatBottomSheet);
    private readonly store = inject(Store);
    private readonly toolbar = inject(ToolbarConfigurationService);
    private readonly notofication = inject(NotificationService);

    protected group?: GroupInfo;
    protected paidBySummary: Record<string, number> = {};
    protected totalAmount: number = 0;
    protected expenseTotalByCategory: Record<number, number> = {};
    protected expenseTotalBySubCategory: Record<number, number> = {};
    protected expensesBySubCategory: Record<number, Expense[]> = {};

    protected readonly groupId = input.required<string>();
    protected readonly $group = computed(() => {
        const group = this.store.selectSignal(
            GroupSelector.selectGroup(this.groupId()),
        )();
        this.subCategoryCategoryMap = fromPairs(
            flatMap(group?.categories, (c) =>
                c.subCategories.map((s) => [s.id, c.id]),
            ),
        );
        return group;
    });
    protected readonly $expandedCategoryId = this.store.selectSignal(
        GroupSelector.selectExpandedCategoryId,
    );
    protected readonly $expandedSubCategoryId = this.store.selectSignal(
        GroupSelector.selectExpandedSubCategoryId,
    );
    protected readonly $filterCriteria = this.store.selectSignal(
        GroupSelector.selectExpenseFilterCriteria,
    );

    private subCategoryCategoryMap: Record<number, number> = {};

    constructor() {
        const today = new Date();
        if (!this.$filterCriteria()) {
            this.store.dispatch(
                GroupAction.setExpenseFilterCriteria({
                    criteria: {
                        dateOption: DateOption.Current,
                        fromDate: DateUtilities.startOfMonth(today),
                        toDate: DateUtilities.endOfMonth(today),
                    },
                }),
            );
        }

        const $expenses = this.store.selectSignal(
            ExpenseSelector.selectAllExpenses,
        );
        const $loading = this.store.selectSignal(ExpenseSelector.isLoading);
        effect(
            () => {
                const criteria = this.$filterCriteria();
                if (criteria) {
                    this.expenseTotalByCategory = {};
                    this.expenseTotalBySubCategory = {};
                    this.expensesBySubCategory = {};
                    this.paidBySummary = {};
                    this.totalAmount = 0;

                    const expenses = $expenses().filter(
                        (expense) =>
                            expense.expenseDate >= criteria.fromDate &&
                            expense.expenseDate <= criteria.toDate,
                    );

                    expenses.forEach((expense) => {
                        if (expense.category) {
                            this.expensesBySubCategory[expense.category] ??= [];
                            this.expensesBySubCategory[expense.category].push(
                                expense,
                            );

                            const categoryId =
                                this.subCategoryCategoryMap[expense.category];
                            this.expenseTotalByCategory[categoryId] ??= 0;
                            this.expenseTotalByCategory[categoryId] +=
                                expense.amount;

                            this.expenseTotalBySubCategory[expense.category] ??=
                                0;
                            this.expenseTotalBySubCategory[expense.category] +=
                                expense.amount;
                        }

                        const memberName =
                            this.$group()?.members[expense.paidBy].name ?? "";
                        this.paidBySummary[memberName] ??= 0;
                        this.paidBySummary[memberName] += expense.amount;
                        this.totalAmount += expense.amount;
                    });
                }

                if ($loading()) {
                    this.notofication.showLoading();
                } else {
                    this.notofication.hideLoading();
                }
            },
            { allowSignalWrites: true },
        );
    }

    ngOnInit() {
        this.toolbar.configure({
            back: { visible: () => true },
            actionBtns: [
                {
                    position: "right",
                    color: "secondary",
                    icon: "tune",
                    action: () => {
                        this.bottomSheet
                            .open(FilterExpenseCriteriaComponent)
                            .afterDismissed()
                            .subscribe(() => this.getExpenses());
                    },
                },
            ],
        });

        this.getExpenses();
    }

    protected getCategoryById(id: number): Category {
        return (
            this.$group()?.categories.find((category) => category.id === id) ??
            DEFAULT_CATEGORY
        );
    }

    protected toggleExpandCategory(categoryId: number) {
        this.store.dispatch(GroupAction.setExpandedCategoryId({ categoryId }));
    }

    protected toggleExpandSubCategory(subCategoryId: number) {
        this.store.dispatch(
            GroupAction.setExpandedSubCategoryId({ subCategoryId }),
        );
    }

    get hasData() {
        return Object.keys(this.expenseTotalByCategory).length > 0;
    }

    private getExpenses() {
        if (!this.$filterCriteria()) {
            return;
        }

        this.store.dispatch(
            ExpenseAction.getByDateRange({
                groupId: this.groupId(),
                startDate: this.$filterCriteria()!.fromDate,
                endDate: this.$filterCriteria()!.toDate,
            }),
        );
    }
}
