import { CommonModule } from "@angular/common";
import {
    Component,
    computed,
    effect,
    inject,
    input,
    numberAttribute,
    OnInit,
} from "@angular/core";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { Store } from "@ngrx/store";
import { groupBy } from "lodash-es";

import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { ExpenseAction } from "../../store/expense/expense.action";
import { ExpenseSelector } from "../../store/expense/expense.selector";
import { GroupSelector } from "../../store/group/group.selector";
import { DateUtilities } from "../../utilities/date";
import { DividerComponent } from "../shared/divider.component";
import { LayoutComponent } from "../shared/layout.component";

import { ALL_TIME_FROM, ALL_TIME_TO } from "./investment-group.component";
import { InvestmentSettingsComponent } from "./investment-settings.component";

@Component({
    selector: "app-investment-list",
    imports: [
        CommonModule,
        DividerComponent,
        LayoutComponent,
        MatIconModule,
        RouterLink,
    ],
    template: `
        @if ($assetClass(); as assetClass) {
            <app-layout headerHeight="120px">
                <div section="header" class="header">
                    <span class="header-title">
                        <span class="header-icon">{{ assetClass.icon }}</span>
                        <span class="header-name">{{ assetClass.name }}</span>
                    </span>
                    <span class="header-total">
                        <span class="header-currency">&#8377;</span>
                        {{ $net() | number: "1.0-0" }}
                    </span>
                    <span class="header-label">total invested</span>
                </div>

                <div section="detail">
                    @for (
                        kvp of $itemsByMonth() | keyvalue: noSort;
                        track kvp.key
                    ) {
                        <div class="expense-record-container">
                            <div class="month-group">
                                {{ kvp.key | date: "MMMM yyyy" | uppercase }}
                            </div>
                            @for (item of kvp.value; track item.id) {
                                <a
                                    class="expense-record"
                                    [routerLink]="[
                                        '/group',
                                        groupId(),
                                        'expense',
                                        item.id,
                                    ]"
                                >
                                    <span class="expense-date">
                                        <span class="expense-date-month">{{
                                            item.expenseDate
                                                | date: "MMM"
                                                | uppercase
                                        }}</span>
                                        <span class="expense-date-date">{{
                                            item.expenseDate | date: "dd"
                                        }}</span>
                                    </span>
                                    <mat-icon
                                        class="expense-trend"
                                        [class.withdrawn]="item.amount < 0"
                                        >{{
                                            item.amount < 0
                                                ? "arrow_circle_down"
                                                : "arrow_circle_up"
                                        }}</mat-icon
                                    >
                                    <span class="expense-desc">
                                        <span>{{ item.description }}</span>
                                        @if (item.where) {
                                            <span class="expense-desc-where"
                                                >{{ item.where }}</span
                                            >
                                        }
                                    </span>
                                    <span class="expense-amount">
                                        &#8377;
                                        {{
                                            item.amount
                                                | number: "1.0-2"
                                        }}
                                    </span>
                                </a>
                                @if ($index !== kvp.value.length - 1) {
                                    <app-divider></app-divider>
                                }
                            }
                        </div>
                    } @empty {
                        <div class="empty">
                            No investments yet. Tap + to add one.
                        </div>
                    }
                </div>
            </app-layout>
        }
    `,
    styles: [
        `
            .header {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2px;

                &-title {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    opacity: 0.8;
                }

                &-icon {
                    font-size: 1.1rem;
                }

                &-name {
                    font-size: 1rem;
                    font-weight: 500;
                }

                &-total {
                    font-size: 2.4rem;
                    font-weight: 600;
                    line-height: 1.2;
                }

                &-currency {
                    font-size: 1.4rem;
                    font-weight: 400;
                    opacity: 0.7;
                }

                &-label {
                    font-size: 0.7rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    opacity: 0.6;
                }
            }

            .expense-record-container {
                margin-bottom: 16px;

                .month-group {
                    font-weight: 500;
                    font-size: 0.9rem;
                    margin: 8px 0;
                }

                > mat-divider {
                    margin: 4px 16px;
                }

                .expense-record {
                    text-decoration: none;
                    color: inherit;
                    display: grid;
                    grid-template-columns: 0.5fr 0.5fr 2.75fr 1.25fr;
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
                            font-size: 1.1rem;
                        }
                    }

                    .expense-trend {
                        justify-self: center;
                        color: green;

                        &.withdrawn {
                            color: red;
                        }
                    }

                    .expense-desc {
                        display: flex;
                        flex-direction: column;

                        &-where {
                            font-size: 0.6rem;
                        }
                    }
                }
            }

            .empty {
                text-align: center;
                padding: 32px;
                font-size: 0.8rem;
                opacity: 0.7;
            }
        `,
    ],
})
export class InvestmentListComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly toolbar = inject(ToolbarConfigurationService);
    private readonly bottomSheet = inject(MatBottomSheet);

    protected readonly groupId = input.required<string>();
    protected readonly categoryId = input.required<number, string>({
        transform: numberAttribute,
    });

    private readonly $investments = this.store.selectSignal(
        ExpenseSelector.selectAllExpenses,
    );

    private readonly $group = computed(() =>
        this.store.selectSignal(GroupSelector.selectGroup(this.groupId()))(),
    );

    protected readonly $assetClass = computed(() => {
        const category = this.$group()?.categories.find(
            (c) => c.id === this.categoryId(),
        );
        return (
            category && {
                ...category,
                icon: category.subCategories[0]?.icon,
            }
        );
    });

    protected readonly $items = computed(() => {
        const ids = new Set(
            this.$assetClass()?.subCategories.map((s) => s.id) ?? [],
        );
        return this.$investments().filter(
            (i) => i.category !== undefined && ids.has(i.category),
        );
    });

    protected readonly $net = computed(() =>
        this.$items().reduce((sum, i) => sum + i.amount, 0),
    );

    protected readonly $itemsByMonth = computed(() =>
        groupBy(this.$items(), (i) => DateUtilities.yearMonth(i.expenseDate)),
    );

    protected noSort(): number {
        return 0;
    }

    constructor() {
        effect(() => {
            this.store.dispatch(
                ExpenseAction.getByDateRange({
                    groupId: this.groupId(),
                    startDate: ALL_TIME_FROM,
                    endDate: ALL_TIME_TO,
                }),
            );
        });
    }

    ngOnInit(): void {
        this.toolbar.configure({
            back: { visible: () => true },
            actionBtns: [
                {
                    position: "center",
                    color: "primary",
                    icon: "add",
                    redirectTo: () => ["/group", this.groupId(), "expense"],
                },
                {
                    position: "right",
                    color: "primary",
                    icon: "settings",
                    action: () =>
                        this.bottomSheet.open(InvestmentSettingsComponent, {
                            data: { groupId: this.groupId() },
                        }),
                },
            ],
        });
    }
}
