import { Component, effect, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";

import { DateOption, FilterCriteria } from "../../models/filter-criteria.model";
import { DateUtilities } from "../../utilities/date";
import { Store } from "@ngrx/store";
import { GroupSelector } from "../../store/group/group.selector";
import { GroupAction } from "../../store/group/group.action";

@Component({
    selector: "app-filter-expense-criteria",
    imports: [
        FormsModule,
        MatButtonModule,
        MatRadioModule,
        MatDatepickerModule,
        MatInputModule,
        MatFormFieldModule,
    ],
    providers: [provideNativeDateAdapter()],
    template: `
        @if (criteria) {
            <div class="filter-container">
                <div>
                    <mat-radio-group [(ngModel)]="criteria.dateOption">
                        <mat-radio-button [value]="dateOption.Current"
                            >This Month</mat-radio-button
                        >
                        <mat-radio-button [value]="dateOption.Last"
                            >Last Month</mat-radio-button
                        >
                        <mat-radio-button [value]="dateOption.Custom"
                            >Custom</mat-radio-button
                        >
                    </mat-radio-group>
                </div>

                <div>
                    @if (criteria.dateOption === dateOption.Custom) {
                        <mat-form-field>
                            <input
                                matInput
                                [matDatepicker]="fromDp"
                                [(ngModel)]="criteria.fromDate"
                            />
                            <mat-datepicker-toggle
                                matIconSuffix
                                [for]="fromDp"
                            ></mat-datepicker-toggle>
                            <mat-datepicker #fromDp></mat-datepicker>
                        </mat-form-field>

                        <mat-form-field>
                            <input
                                matInput
                                [matDatepicker]="toDp"
                                [(ngModel)]="criteria.toDate"
                            />
                            <mat-datepicker-toggle
                                matIconSuffix
                                [for]="toDp"
                            ></mat-datepicker-toggle>
                            <mat-datepicker #toDp></mat-datepicker>
                        </mat-form-field>
                    }
                </div>

                <div class="btn-group">
                    <button
                        mat-raised-button
                        class="rounded"
                        color="primary"
                        (click)="close()"
                    >
                        Apply
                    </button>
                </div>
            </div>
        }
    `,
    styles: [
        `
            .filter-container {
                display: flex;
                flex-direction: column;
                gap: 16px;
                height: 100%;
            }

            .btn-group {
                display: flex;
                gap: 16px;
                justify-content: space-between;

                > button {
                    border-radius: 16px;
                    width: 100%;
                }
            }
        `,
    ],
})
export class FilterExpenseCriteriaComponent {
    private readonly store = inject(Store);
    private readonly bottomSheet = inject(
        MatBottomSheetRef<FilterExpenseCriteriaComponent>,
    );

    protected criteria?: FilterCriteria;

    dateOption = DateOption;

    constructor() {
        const criteria = this.store.selectSignal(
            GroupSelector.selectExpenseFilterCriteria,
        );
        effect(() => {
            if (criteria()) {
                this.criteria = { ...criteria()! };
            }
        });
    }

    close() {
        if (!this.criteria) {
            return;
        }

        let fromDate = this.criteria.fromDate;
        let toDate = this.criteria.toDate;

        if (this.criteria.dateOption === DateOption.Current) {
            fromDate = DateUtilities.startOfMonth();
            toDate = DateUtilities.endOfMonth();
        } else if (this.criteria.dateOption === DateOption.Last) {
            const date = DateUtilities.previousMonth();
            fromDate = DateUtilities.startOfMonth(date);
            toDate = DateUtilities.endOfMonth(date);
        } else {
            fromDate = DateUtilities.startOfDay(fromDate);
            toDate = DateUtilities.endOfDay(toDate);
        }

        this.store.dispatch(
            GroupAction.setExpenseFilterCriteria({
                criteria: {
                    dateOption: this.criteria.dateOption,
                    fromDate,
                    toDate,
                },
            }),
        );

        this.bottomSheet.dismiss();
    }
}
