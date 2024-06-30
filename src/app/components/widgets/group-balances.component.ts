import { Component, Input } from "@angular/core";
import { keys } from "lodash-es";

import { Group } from "../../models/group.model";


@Component({
	selector: "app-group-balances",
	standalone: true,
	imports: [

	],
	template: `
		@if(group) {
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

			@for (payment of settleExpenses(); track payment) {
				{{payment.from}} -> {{payment.to}} : {{payment.amount}}
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
	@Input() group?: Group;

	protected settleExpenses() {
		const payments: Payment[] = [];
		const members = this.group?.members;
		if (!this.group || !members) {
			return payments;
		}

		const balance: Record<string, number> = {};
		this.group.memberIds.forEach(id => {
			balance[id] = (balance[id] || 0) + members[id].paid - members[id].share;
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