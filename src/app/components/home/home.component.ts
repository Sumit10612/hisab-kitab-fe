import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatTabsModule } from "@angular/material/tabs";
import { Store } from "@ngrx/store";

import { GroupType } from "../../models/group.model";
import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { ExpenseAction } from "../../store/expense/expense.action";
import { GroupSelector } from "../../store/group/group.selector";

import { InvestmentGroupComponent } from "../investment/investment-group.component";
import { InvestmentSettingsComponent } from "../investment/investment-settings.component";
import { LayoutComponent } from "../shared/layout.component";
import { GroupListComponent } from "./group-list.component";
import { OverviewComponent } from "./overview.component";
import { GroupAction } from "../../store/group/group.action";

const INVESTMENTS_TAB = 1;

let lastSelectedTab = 0;

@Component({
    selector: "app-home",
    imports: [
        GroupListComponent,
        InvestmentGroupComponent,
        LayoutComponent,
        MatTabsModule,
        OverviewComponent,
    ],
    template: `
        @if ($visibleGroups(); as groups) {
            <app-layout headerHeight="152px">
                <div section="header">
                    <app-overview
                        [groups]="groups"
                        [mode]="
                            $selectedTab() === investmentsTab
                                ? 'investment'
                                : 'groups'
                        "
                        [investedTotal]="$investmentGroup()?.groupTotal ?? 0"
                    ></app-overview>
                </div>

                <div section="detail">
                    <mat-tab-group
                        [selectedIndex]="$selectedTab()"
                        (selectedIndexChange)="onTabChange($event)"
                    >
                        <mat-tab label="My Groups">
                            <app-group-list [groups]="groups"></app-group-list>
                        </mat-tab>
                        <mat-tab label="My Investments">
                            <ng-template matTabContent>
                                <app-investment-group
                                    [group]="$investmentGroup()"
                                ></app-investment-group>
                            </ng-template>
                        </mat-tab>
                    </mat-tab-group>
                </div>
            </app-layout>
        }
    `,
})
export class HomeComponent implements OnInit {
    private readonly toolbar = inject(ToolbarConfigurationService);
    private readonly store = inject(Store);
    private readonly bottomSheet = inject(MatBottomSheet);

    private investmentGroupRequested = false;

    protected readonly investmentsTab = INVESTMENTS_TAB;
    protected readonly $selectedTab = signal(lastSelectedTab);

    protected readonly $groups = this.store.selectSignal(
        GroupSelector.selectAll,
    );
    protected readonly $visibleGroups = computed(() =>
        this.$groups().filter((g) => g.groupType !== GroupType.Investment),
    );
    protected readonly $investmentGroup = this.store.selectSignal(
        GroupSelector.selectInvestmentGroup,
    );

    ngOnInit(): void {
        this.store.dispatch(ExpenseAction.reset());
        this.store.dispatch(
            GroupAction.setExpenseFilterCriteria({ criteria: null }),
        );
        this.store.dispatch(
            GroupAction.setExpandedCategoryId({ categoryId: null }),
        );

        this.onTabChange(this.$selectedTab());
    }

    protected onTabChange(index: number): void {
        lastSelectedTab = index;
        this.$selectedTab.set(index);

        // the expense store is shared, so drop investments before opening a
        // group (and groups' expenses before the investments are fetched)
        this.store.dispatch(ExpenseAction.reset());

        if (index === INVESTMENTS_TAB) {
            this.ensureInvestmentGroup();
            this.configureInvestmentToolbar();
        } else {
            this.configureGroupToolbar();
        }
    }

    // "My Investments" is a group that is created the first time it is opened
    private ensureInvestmentGroup(): void {
        if (!this.$investmentGroup() && !this.investmentGroupRequested) {
            this.investmentGroupRequested = true;
            this.store.dispatch(GroupAction.createInvestmentGroup());
        }
    }

    private configureGroupToolbar(): void {
        this.toolbar.configure({
            profile: { visible: () => true },
            actionBtns: [
                {
                    color: "warn",
                    icon: "group_add",
                    redirectTo: () => "/group",
                    position: "center",
                },
            ],
        });
    }

    private configureInvestmentToolbar(): void {
        this.toolbar.configure({
            profile: { visible: () => true },
            actionBtns: [
                {
                    color: "warn",
                    icon: "add",
                    position: "center",
                    disabled: () => !this.$investmentGroup(),
                    redirectTo: () => [
                        "/group",
                        this.$investmentGroup()?.id ?? "",
                        "expense",
                    ],
                },
                {
                    color: "primary",
                    icon: "settings",
                    position: "right",
                    disabled: () => !this.$investmentGroup(),
                    action: () => {
                        const groupId = this.$investmentGroup()?.id;
                        if (groupId) {
                            this.bottomSheet.open(InvestmentSettingsComponent, {
                                data: { groupId },
                            });
                        }
                    },
                },
            ],
        });
    }
}
