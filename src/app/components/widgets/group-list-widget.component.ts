import { CdkDragDrop, DragDropModule, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatDividerModule } from "@angular/material/divider";
import { RouterLink } from "@angular/router";
import { round } from "lodash";

import { getGroupImage, Group, GroupType } from "../../models/group.model";
import { getYearMonth } from "../../utilities/date";

@Component({
	selector: "app-group-list-selector",
	standalone: true,
	imports: [DragDropModule, MatDividerModule, RouterLink],
	template: `
		<div cdkDropList
			cdkDropListLockAxis="y"
			(cdkDropListDropped)="onDrop($event)">
				@for (group of groups; track group) {
					<div class="drag-list-container-item" cdkDrag
						[cdkDragStartDelay]="1000"
						[routerLink]="['/group-detail', group?.id]">
						<img
							width="50"
							height="50"
							[src]="getGroupImage(group?.imageUrl).src"
							[alt]="getGroupImage(group?.imageUrl).alt" />
						
						<span class="group-name">{{group?.name}}</span>

						<div class="group-total">
							<span>&#8377;{{group?.groupType === groupType.SpiltExpense ? group?.groupTotal ?? 0 : currentMonthTotal(group)}}</span>
							<span class="group-total-text">
								{{group?.groupType === groupType.SpiltExpense ? "total balance" : "this month"}}
							</span>
						</div>
					</div>
					<mat-divider></mat-divider>
				}
		</div>
	`,
	styles: [`
		.drag-list-container-item {
			display: grid;
			grid-template-columns: 1fr 2fr 2fr;
			grid-gap: 16px;
			align-items: center;
			padding: 8px;
			cursor: pointer;

			.group-name {
				font-weight: 500;
			}

			.group-total {
				display: flex;
				flex-direction: column;
				text-align: right;
				font-size: 1.05rem;

				&-text {
					font-size: 0.6rem;
				}
			}
		}

		.cdk-drag-preview {
			box-sizing: border-box;
			border-radius: 4px;
			box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
						0 8px 10px 1px rgba(0, 0, 0, 0.14),
						0 3px 14px 2px rgba(0, 0, 0, 0.12);
		}

		.cdk-drag-placeholder {
			opacity: 0;
		}

		.cdk-drag-animating {
			transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
		}

		.drag-list-container.cdk-drop-list-dragging .drag-list-container-item:not(.cdk-drag-placeholder) {
			transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
		}
	`]
})
export class GroupListWidgetComponent {
	protected getGroupImage = getGroupImage;
	protected groupType = GroupType;
	
	@Input() groups?: Group[] | null;
	@Output() reorderedGroupList = new EventEmitter<Group[]>();

	currentMonthTotal(group: Group): number {
		const currMonth = getYearMonth(new Date());
		const total = group.monthTotal[currMonth] ?? 0;

		return round(+total, 2);
	}

	onDrop(event: CdkDragDrop<Group[]>) {
		if(!this.groups) {
			return;
		}

		moveItemInArray(this.groups, event.previousIndex, event.currentIndex);

		this.reorderedGroupList.emit(this.groups);
	}
}