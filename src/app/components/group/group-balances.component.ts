import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { keys } from "lodash-es";

import { Group } from "../../models/group.model";

@Component({
	selector: "app-group-balances",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [ ],
	template: `
		@if(group(); as group) {
			<div class="container">
				<div class="balance-info">
					<span></span>
					<span class="header right">Share</span>
					<span class="header right">Paid</span>
				</div>
				@for (id of group.memberIds; track id) {
					<div class="balance-info">
						<span>{{group.members[id].name}}</span>
						<span class="right">&#8377; {{group.members[id].share}}</span>
						<span class="right">&#8377; {{group.members[id].paid}}</span>
					</div>
				}
			</div>

			@for (payment of settleExpenses(group); track payment) {
				<div>
					{{group.members[payment.from].name}} -> {{group.members[payment.to].name}} : 
					<span class="right">&#8377; {{payment.amount}}</span>
				</div>
			}
		}
	`,
	styles: [`
		.container {
			margin: 16px 0;
			display: flex;
			flex-direction: column;
			gap: 12px;

			.balance-info {
				display: grid;
				grid-template-columns: 2fr 1fr 1fr;
				justify-content: space-between;

				.header {
					font-weight: 500;
				}

				.right {
					text-align: right;
				}
			}
		}
	`]
})
export class GroupBalancesComponent {
	readonly group = input.required<Group>();

	protected settleExpenses(group: Group) {
		const payments: Payment[] = [];
		const balance: Record<string, number> = {};
		group.memberIds.forEach(id => {
			balance[id] = (balance[id] || 0) + group.members[id].paid - group.members[id].share;
		});

		const membersOwed = keys(balance).filter(id => balance[id] < 0);
		const membersOwing = keys(balance).filter(id => balance[id] > 0);

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
				amount: paymentAmount
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