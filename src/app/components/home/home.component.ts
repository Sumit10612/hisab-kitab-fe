import { Component, inject, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";

import {
    ToolbarButtonColor,
    ToolbarButtonPosition,
} from "../../models/toolbar.model";
import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { ExpenseAction } from "../../store/expense/expense.action";
import { GroupSelector } from "../../store/group/group.selector";

import { LayoutComponent } from "../shared/layout.component";
import { GroupListComponent } from "./group-list.component";
import { OverviewComponent } from "./overview.component";
import { GroupAction } from "../../store/group/group.action";

@Component({
    selector: "app-home",
    imports: [GroupListComponent, LayoutComponent, OverviewComponent],
    template: `
        @if ($groups(); as groups) {
            <app-layout headerHeight="152px">
                <div section="header">
                    <app-overview [groups]="groups"></app-overview>
                </div>

                <div section="detail">
                    My Groups
                    <app-group-list [groups]="groups"></app-group-list>
                </div>
            </app-layout>
        }
    `,
    styles: [
        `
            .create-group-button {
                position: absolute;
                right: 4px;
                bottom: 4px;
            }
        `,
    ],
})
export class HomeComponent implements OnInit {
    private readonly toolbar = inject(ToolbarConfigurationService);
    private readonly store = inject(Store);

    protected $groups = this.store.selectSignal(GroupSelector.selectAll);

    ngOnInit(): void {
        this.store.dispatch(ExpenseAction.reset());
        this.store.dispatch(
            GroupAction.setExpenseFilterCriteria({ criteria: null }),
        );
        this.store.dispatch(
            GroupAction.setExpandedCategoryId({ categoryId: null }),
        );

        this.toolbar.configure({
            profile: { visible: () => true },
            actionBtns: [
                {
                    color: () => ToolbarButtonColor.Warn,
                    icon: "group_add",
                    redirectTo: () => "/group",
                    position: ToolbarButtonPosition.Center,
                },
            ],
        });
    }
}
