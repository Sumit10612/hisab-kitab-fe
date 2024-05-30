import { Component, Input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { round } from "lodash";

import { getGroupImage, Group, GroupType } from "../../models/group.model";
import { getYearMonth } from "../../utilities/date";

@Component({
	selector: "app-group-widget",
	standalone: true,
	imports: [MatCardModule, MatIconModule, RouterLink],
	template: `
	<mat-card [routerLink]="['/group-detail', data?.id]">
		<mat-card-content>
			<img
				width="50"
				height="50"
				[src]="getGroupImage(data?.imageUrl).src"
				[alt]="getGroupImage(data?.imageUrl).alt" />

			<div class="group-info">
				<div class="group-info-name">{{data?.name}}</div>
				@if (data?.groupType === groupType.SpiltExpense) {
					<span>Total balance &#8377;{{data?.groupTotal ?? 0}}</span>
				} @else {
					<span class="group-info-total">This month: &#8377;{{currentMonthTotal}}</span>
				}
			</div>
		</mat-card-content>
	</mat-card>
	`,
	styles: [`
		.mat-mdc-card-content {
			display: flex;
			align-items: center;
			padding: 8px;
			gap: 24px;
		}

		.group-info {
			display: flex;
			flex-direction: column;
			gap: 4px;

			&-name {
				font-size: 1.2rem;
				font-weight: 500;
			}

			&-total {
				font-size: 1.05rem;
			}
		}
	`]
})
export class GroupWidgetComponent {
	protected getGroupImage = getGroupImage;
	protected groupType = GroupType;

	@Input() data: Group | undefined;

	get currentMonthTotal(): number {
		const currMonth = getYearMonth(new Date());
		const total = this.data?.monthTotal[currMonth] ?? 0;

		return round(+total, 2);
	}
}
