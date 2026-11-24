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

import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { ExpenseAction } from "../../store/expense/expense.action";
import { ExpenseSelector } from "../../store/expense/expense.selector";
import { GroupSelector } from "../../store/group/group.selector";
import { DividerComponent } from "../shared/divider.component";
import { LayoutComponent } from "../shared/layout.component";

import { ALL_TIME_FROM, ALL_TIME_TO } from "./investment-classes.component";
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
            <app-layout headerHeight="96px">
                <div section="header" class="header">
                    <span class="header-icon">{{ assetClass.icon }}</span>
                    <h2>{{ assetClass.name }}</h2>
                    <span class="header-total">
                        &#8377;{{ $net() | number: "1.0-0" }} invested
                    </span>
                </div>

                <div section="detail" class="detail">
                    @for (item of $items(); track item.id) {
                        <a
                            class="item"
                            [routerLink]="[
                                '/group',
                                groupId(),
                                'expense',
                                item.id,
                            ]"
                        >
                            <span class="item-date">
                                <span class="item-date-month">{{
                                    item.expenseDate | date: "MMM" | uppercase
                                }}</span>
                                <span class="item-date-date">{{
                                    item.expenseDate | date: "dd"
                                }}</span>
                                <span class="item-date-year">{{
                                    item.expenseDate | date: "yyyy"
                                }}</span>
                            </span>
                            <span class="item-desc">
                                <span>{{ item.description }}</span>
                            </span>
                            <span
                                class="item-amount"
                                [class.withdrawn]="item.amount < 0"
                            >
                                <mat-icon class="item-amount-icon">{{
                                    item.amount < 0
                                        ? "arrow_downward"
                                        : "arrow_upward"
                                }}</mat-icon>
                                &#8377;{{ abs(item.amount) | number: "1.0-2" }}
                            </span>
                        </a>
                        @if ($index !== $items().length - 1) {
                            <app-divider></app-divider>
                        }
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

                &-icon {
                    font-size: 1.8rem;
                }

                h2 {
                    margin: 0;
                }

                &-total {
                    font-size: 0.8rem;
                    opacity: 0.8;
                }
            }

            .detail {
                display: block;
                padding: 8px;
            }

            .item {
                display: grid;
                grid-template-columns: 0.6fr 2.4fr 1.4fr;
                gap: 8px;
                align-items: center;
                text-decoration: none;
                color: inherit;
                padding: 4px 8px;

                &-date {
                    display: flex;
                    flex-direction: column;
                    align-items: center;

                    &-month,
                    &-year {
                        font-size: 0.6rem;
                    }

                    &-date {
                        font-size: 1.1rem;
                    }
                }

                &-desc {
                    display: flex;
                    flex-direction: column;
                }

                &-amount {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    font-size: inherit;
                    color: green;

                    &.withdrawn {
                        color: red;
                    }

                    &-icon {
                        font-size: 1.2em;
                        width: 1em;
                        height: 1em;
                        margin-right: 2px;
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

    protected readonly abs = Math.abs;

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
