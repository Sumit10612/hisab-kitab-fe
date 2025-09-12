import { Component, input } from "@angular/core";
import { MatDividerModule } from "@angular/material/divider";
import { RouterLink } from "@angular/router";
import { round } from "lodash-es";

import { getGroupImage, Group, GroupType } from "../../models/group.model";
import { DateUtilities } from "../../utilities/date";

@Component({
    selector: "app-group-list",
    standalone: true,
    imports: [MatDividerModule, RouterLink],
    template: `
        @for (group of groups(); track group.id) {
            <div
                class="container"
                [routerLink]="['/group', group.id, 'expenses']"
            >
                <img
                    width="50"
                    height="50"
                    [src]="getGroupImage(group.imageUrl).src"
                    [alt]="getGroupImage(group.imageUrl).alt"
                />

                <span class="group-name">{{ group?.name }}</span>

                <div class="group-total">
                    <span>&#8377;{{ getTotal(group) }}</span>
                    <span class="group-total-text">
                        {{
                            group?.groupType === groupType.SpiltExpense
                                ? "total balance"
                                : "this month"
                        }}
                    </span>
                </div>
            </div>
            <mat-divider></mat-divider>
        }
    `,
    styles: [
        `
            .container {
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
        `,
    ],
})
export class GroupListComponent {
    protected readonly getGroupImage = getGroupImage;
    protected readonly groupType = GroupType;

    readonly groups = input.required<Group[]>();

    protected getTotal(group: Group): number {
        return round(
            group.groupType === GroupType.ExpenseTracker
                ? (group.monthTotal[DateUtilities.yearMonth()] ?? 0)
                : group.groupTotal,
        );
    }
}
