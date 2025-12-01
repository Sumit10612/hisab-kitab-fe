import { Component, computed, inject, input, OnInit } from "@angular/core";
import { keys } from "lodash-es";

import { Group } from "../../models/group.model";
import { LayoutComponent } from "../shared/layout.component";
import { GroupExpensesHeaderComponent } from "./group-expenses-header.component";
import { Store } from "@ngrx/store";
import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { GroupSelector } from "../../store/group/group.selector";
import { MatButtonModule } from "@angular/material/button";
import { ToolbarButtonType } from "../../models/toolbar.model";
import { CommonModule } from "@angular/common";

@Component({
    selector: "app-group-expenses-balances",
    standalone: true,
    imports: [GroupExpensesHeaderComponent, LayoutComponent, MatButtonModule, CommonModule],
    template: `
        @if ($group(); as group) {
            <app-layout headerHeight="160px">
                <div section="header">
                    <app-group-expenses-header
                        [group]="group"
                        page="balance"
                    ></app-group-expenses-header>
                </div>
                <div section="detail" class="detail-section">
                    @for (payment of settleExpenses(group); track $index) {
                        <div class="balance-info">
                            <span
                                >{{ group.members[payment.from].name }} owe
                                {{ group.members[payment.to].name }}</span
                            >
                            <span class="right"
                                >&#8377; {{ payment.amount | number: "1.2-2" }}</span
                            >
                        </div>
                    }
                </div>
            </app-layout>
        }
    `,
    styles: [
        `
            .detail-section {
                display: flex;
                flex-direction: column;
                gap: 12px;

                .balance-info {
                    display: flex;
                    justify-content: space-between;

                    .header {
                        font-weight: 500;
                    }
                }
            }
        `,
    ],
})
export class GroupExpensesBalancesComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly toolbar = inject(ToolbarConfigurationService);

    protected readonly groupId = input.required<string>();
    protected readonly $group = computed(() =>
        this.store.selectSignal(GroupSelector.selectGroup(this.groupId()))(),
    );

    ngOnInit(): void {
        this.toolbar.configure({
            back: { visible: () => true },
            actionBtns: [
                {
                    type: ToolbarButtonType.Primary,
                    label: "Settle",
                },
            ],
        });
    }

    protected settleExpenses(group: Group) {
        const payments: Payment[] = [];
        const balance: Record<string, number> = {};
        group.memberIds.forEach((id) => {
            balance[id] =
                (balance[id] || 0) +
                group.members[id].paid -
                group.members[id].share;
        });

        const membersOwed = keys(balance).filter((id) => balance[id] < 0);
        const membersOwing = keys(balance).filter((id) => balance[id] > 0);

        // Create payments to settle balances
        let i = 0;
        let j = 0;
        while (i < membersOwed.length && j < membersOwing.length) {
            const memberOwed = membersOwed[i];
            const memberOwing = membersOwing[j];
            const amountOwed = -balance[memberOwed];
            const amountOwing = balance[memberOwing];
            const paymentAmount = Math.min(amountOwed, amountOwing);

            payments.push({
                from: memberOwed,
                to: memberOwing,
                amount: paymentAmount,
            });

            balance[memberOwed] += paymentAmount;
            balance[memberOwing] -= paymentAmount;

            if (balance[memberOwed] === 0) {
                i++;
            }
            if (balance[memberOwing] === 0) {
                j++;
            }
        }

        return payments;
    }
}

interface Payment {
    from: string; // Member who needs to pay
    to: string; // Member who will receive the payment
    amount: number; // Amount to be paid
}
