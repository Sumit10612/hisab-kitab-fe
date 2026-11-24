import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterLink } from "@angular/router";
import { Store } from "@ngrx/store";

import { GroupInfo } from "../../models/group.model";
import { ExpenseAction } from "../../store/expense/expense.action";
import { ExpenseSelector } from "../../store/expense/expense.selector";

export const ALL_TIME_FROM = new Date(2000, 0, 1);
export const ALL_TIME_TO = new Date(2100, 0, 1);

@Component({
    selector: "app-investment-group",
    imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, RouterLink],
    template: `
        @if (group(); as group) {
            <div class="cards">
                @for (assetClass of $assetClasses(); track assetClass.id) {
                    <a
                        class="card-link"
                        [routerLink]="[
                            '/group',
                            group.id,
                            'investments',
                            assetClass.id,
                        ]"
                    >
                        <mat-card appearance="outlined">
                            <mat-card-content class="card">
                                <span class="card-icon">{{
                                    assetClass.icon
                                }}</span>
                                <span class="card-name">{{
                                    assetClass.name
                                }}</span>
                                <span class="card-amount"
                                    >&#8377;{{
                                        assetClass.net | number: "1.0-0"
                                    }}</span
                                >
                                <span class="card-count">
                                    {{ assetClass.count }}
                                    {{
                                        assetClass.count === 1
                                            ? "entry"
                                            : "entries"
                                    }}
                                </span>
                            </mat-card-content>
                        </mat-card>
                    </a>
                }
            </div>
            @if (!$assetClasses().length) {
                <div class="empty">
                    No investments yet. Tap + to add one.
                </div>
            }
        } @else {
            <div class="loading">
                <mat-progress-spinner
                    diameter="24"
                    mode="indeterminate"
                ></mat-progress-spinner>
                <span>Setting up your investments...</span>
            </div>
        }
    `,
    styles: [
        `
            .cards {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                padding-top: 16px;
            }

            .card-link {
                text-decoration: none;
                color: inherit;
            }

            .card {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 12px;

                &-icon {
                    font-size: 1.8rem;
                }

                &-name {
                    margin-top: 4px;
                }

                &-amount {
                    font-size: 1.2rem;
                    font-weight: 500;
                }

                &-count {
                    font-size: 0.65rem;
                    opacity: 0.7;
                }
            }

            .empty {
                text-align: center;
                padding: 32px;
                font-size: 0.8rem;
                opacity: 0.7;
            }

            .loading {
                display: flex;
                gap: 8px;
                justify-content: center;
                align-items: center;
                padding: 32px;
                font-size: 0.8rem;
            }
        `,
    ],
})
export class InvestmentGroupComponent {
    private readonly store = inject(Store);

    private readonly $investments = this.store.selectSignal(
        ExpenseSelector.selectAllExpenses,
    );

    readonly group = input<GroupInfo>();

    protected readonly $assetClasses = computed(() => {
        const investments = this.$investments();
        return (this.group()?.categories ?? [])
            .map((category) => {
                const ids = new Set(category.subCategories.map((s) => s.id));
                const items = investments.filter(
                    (i) => i.category !== undefined && ids.has(i.category),
                );
                return {
                    id: category.id,
                    name: category.name,
                    icon: category.subCategories[0]?.icon,
                    count: items.length,
                    net: items.reduce((sum, i) => sum + i.amount, 0),
                };
            })
            .filter((assetClass) => assetClass.count > 0);
    });

    constructor() {
        const $groupId = computed(() => this.group()?.id);
        effect(() => {
            const groupId = $groupId();
            if (groupId) {
                this.store.dispatch(
                    ExpenseAction.getByDateRange({
                        groupId,
                        startDate: ALL_TIME_FROM,
                        endDate: ALL_TIME_TO,
                    }),
                );
            }
        });
    }
}
