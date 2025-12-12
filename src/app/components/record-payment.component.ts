import { Component, computed, inject, input, OnInit } from "@angular/core";
import { provideNativeDateAdapter } from "@angular/material/core";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { LayoutComponent } from "./shared/layout.component";
import { GroupSelector } from "../store/group/group.selector";
import { Store } from "@ngrx/store";
import { NonNullableFormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";

@Component({
    selector: "app-record-payment",
    imports: [
        LayoutComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
    ],
    providers: [provideNativeDateAdapter()],
    template: `
        <app-layout pageTitle="Record a payment" headerHeight="48px">
            <div section="detail">
                <form [formGroup]="form">
                    <mat-form-field>
                        <input
                            matInput
                            [matDatepicker]="dp"
                            [formControl]="form.controls.expenseDate"
                        />
                        <mat-datepicker-toggle
                            matIconSuffix
                            [for]="dp"
                        ></mat-datepicker-toggle>
                        <mat-datepicker #dp></mat-datepicker>
                    </mat-form-field>
                    <mat-form-field>
                        <mat-label>Paid by</mat-label>
                        <mat-select [formControl]="form.controls.paidBy">
                            @for (
                                member of $group()?.activeMembers;
                                track member.id
                            ) {
                                <mat-option [value]="member.id">
                                    {{ member.name }}
                                </mat-option>
                            }
                        </mat-select>
                    </mat-form-field>
                    <mat-form-field>
                        <mat-label>Paid To</mat-label>
                        <mat-select [formControl]="form.controls.paidTo">
                            @for (
                                member of $group()?.activeMembers;
                                track member.id
                            ) {
                                <mat-option [value]="member.id">
                                    {{ member.name }}
                                </mat-option>
                            }
                        </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="fill" class="full-width">
                        <mat-label>Amount</mat-label>
                        <input
                            matInput
                            type="number"
                            formControlName="amount"
                        />
                    </mat-form-field>
                </form>
            </div>
        </app-layout>
    `,
    styles: [``],
})
export class RecordPaymentComponent implements OnInit {
    private readonly toolbar = inject(ToolbarConfigurationService);
    private readonly store = inject(Store);
    private readonly fb = inject(NonNullableFormBuilder);

    protected readonly groupId = input.required<string>();
    protected readonly $group = computed(() =>
        this.store.selectSignal(GroupSelector.selectGroup(this.groupId()))(),
    );

    protected readonly form = this.fb.group({
        amount: [0],
        paidBy: [""],
        paidTo: [""],
        expenseDate: [new Date()],
    });

    ngOnInit(): void {
        this.toolbar.configure({
            back: { visible: () => true },
            actionBtns: [
                {
                    position: "right",
                    color: "primary",
                    label: "Submit",
                },
            ],
        });
    }
}
