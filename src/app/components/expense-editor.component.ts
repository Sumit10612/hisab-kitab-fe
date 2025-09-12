import { CommonModule } from "@angular/common";
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    input,
    OnInit,
    viewChild,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import {
    MatButtonToggleChange,
    MatButtonToggleModule,
} from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { Store } from "@ngrx/store";
import { uniq, values } from "lodash-es";

import { DEFAULT_CATEGORY, SubCategory } from "../models/category.model";
import { Expense, SplitType } from "../models/expense.model";
import { GroupType } from "../models/group.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { ExpenseAction } from "../store/expense/expense.action";
import { ExpenseSelector } from "../store/expense/expense.selector";
import { GroupSelector } from "../store/group/group.selector";

import { LayoutComponent } from "./shared/layout.component";
import { CategorySelectorComponent } from "./widgets/category-selector.component";
import { PaidByShareComponent } from "./widgets/paid-by-share.component";

@Component({
    selector: "app-add-expense",
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatButtonToggleModule,
        LayoutComponent,
    ],
    providers: [provideNativeDateAdapter()],
    template: `
        <app-layout
            [pageTitle]="
                (form.controls.id.value ? 'Update' : 'Add') + ' an expense'
            "
            [headerHeight]="
                form.controls.groupType.value === groupType.SpiltExpense
                    ? '88px'
                    : '48px'
            "
        >
            <div section="header">
                @if (form.controls.groupType.value === groupType.SpiltExpense) {
                    <div class="shares-tab">
                        <mat-button-toggle-group
                            [(value)]="selectedSplitType"
                            hideSingleSelectionIndicator="true"
                            (change)="onSplitTypeChanged($event)"
                        >
                            <mat-button-toggle [value]="splitType.Equally"
                                >Split equally</mat-button-toggle
                            >
                            <mat-button-toggle [value]="splitType.ByShare"
                                >By share</mat-button-toggle
                            >
                        </mat-button-toggle-group>
                    </div>
                }
            </div>
            <div section="detail" class="detail-section">
                <form [formGroup]="form">
                    <div class="row">
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
                    </div>

                    <mat-form-field>
                        <input
                            matInput
                            placeholder="What is this expense for?"
                            [formControl]="form.controls.description"
                            #focusInput
                        />
                    </mat-form-field>
                    <mat-form-field>
                        <input
                            matInput
                            placeholder="Where did you pay this?"
                            [formControl]="form.controls.where"
                        />
                    </mat-form-field>

                    <div class="row">
                        <mat-form-field appearance="fill" floatLabel="always">
                            <mat-label>Amount</mat-label>
                            <span matTextPrefix>&#8377;</span>
                            <input
                                class="amount-input"
                                matInput
                                type="number"
                                placeholder="0.00"
                                [readonly]="
                                    selectedSplitType !== splitType.Equally
                                "
                                [formControl]="form.controls.amount"
                                (change)="onAmountChange()"
                                (click)="onSplitTypeChanged()"
                                (keyup)="onSplitTypeChanged()"
                            />
                        </mat-form-field>
                        <mat-form-field>
                            <mat-label>Category</mat-label>
                            <input
                                matInput
                                [formControl]="form.controls.category"
                                (click)="openCategorySheet()"
                                (keyup)="openCategorySheet()"
                                readonly
                            />
                            <mat-icon matSuffix (click)="openCategorySheet()"
                                >arrow_drop_down</mat-icon
                            >
                        </mat-form-field>
                    </div>
                </form>

                @if (form.controls.groupType.value === groupType.SpiltExpense) {
                    <div class="shares">
                        @for (
                            member of $group()?.activeMembers;
                            track member.id
                        ) {
                            @if (userShare[member.id] > 0) {
                                <div
                                    class="shares-share"
                                    (click)="onSplitTypeChanged()"
                                >
                                    <span>{{ member.name }}</span>
                                    <span
                                        >&#8377;{{
                                            userShare[member.id] || 0
                                                | number: "1.2-2"
                                        }}</span
                                    >
                                </div>
                            }
                        }
                    </div>
                }
            </div>
        </app-layout>
    `,
    styles: [
        `
            .shares-tab {
                display: flex;
                padding-bottom: 24px;
                justify-content: center;
            }

            .mat-button-toggle-group {
                height: 32px;
                border-radius: 16px;
                align-items: center;
            }

            .detail-section {
                .row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-gap: 16px;
                }

                .amount-input {
                    text-align: right;
                }

                .shares {
                    display: flex;
                    flex-direction: column;
                    width: 100%;

                    &-share {
                        display: flex;
                        justify-content: space-between;
                    }
                }
            }
        `,
    ],
})
export class ExpenseEditorComponent implements OnInit, AfterViewInit {
    private readonly bottomSheet = inject(MatBottomSheet);
    private readonly formBuilder = inject(FormBuilder);
    private readonly toolbar = inject(ToolbarConfigurationService);
    private readonly store = inject(Store);
    private readonly cdr = inject(ChangeDetectorRef);

    private selectedSubCategory = DEFAULT_CATEGORY.subCategories[0];

    protected readonly groupType = GroupType;
    protected readonly splitType = SplitType;
    protected selectedSplitType = SplitType.Equally;
    protected userShare: Record<string, number> = {};
    protected readonly form = this.formBuilder.group({
        id: "",
        groupId: "",
        groupType: this.groupType.ExpenseTracker,
        description: ["", Validators.required],
        where: [""],
        amount: this.formBuilder.control<number | null>(null, {
            validators: [Validators.required],
        }),
        category: this.selectedSubCategory?.name,
        paidBy: ["", Validators.required],
        expenseDate: [new Date(), Validators.required],
    });

    protected readonly expenseId = input<string>("");
    protected readonly groupId = input.required<string>();
    protected readonly focusInput = viewChild("focusInput", {
        read: ElementRef,
    });

    protected readonly $group = computed(() =>
        this.store.selectSignal(GroupSelector.selectGroup(this.groupId()))(),
    );

    constructor() {
        effect(
            () => {
                const group = this.$group();
                const expense = this.store.selectSignal(
                    ExpenseSelector.selectExpense(this.expenseId()),
                )();
                const subCategory = group?.categories
                    .flatMap((category) => category.subCategories)
                    .find((subCat) => subCat.id === expense?.category);
                if (subCategory) {
                    this.selectedSubCategory = subCategory;
                }

                this.userShare = expense?.usersShare ?? {};
                this.form.patchValue({
                    ...expense,
                    category: this.selectedSubCategory.name,
                    paidBy: expense ? expense.paidBy : group?.currentMember.id,
                    groupId: group?.id,
                    groupType: group?.groupType,
                });

                if (uniq(values(expense?.usersShare)).length > 1) {
                    this.selectedSplitType = this.splitType.ByShare;
                }
            },
            {
                allowSignalWrites: true,
            },
        );
    }

    ngOnInit(): void {
        this.toolbar.configure({
            back: { visible: () => true },
            actionBtns: [
                {
                    type: ToolbarButtonType.Warn,
                    label: "Delete",
                    visible: () => !!this.form.controls.id.value,
                    action: () => {
                        const { id, groupId } = this.form.value;
                        if (id && groupId) {
                            this.store.dispatch(
                                ExpenseAction.remove({ groupId, id }),
                            );
                        }
                    },
                },
                {
                    type: ToolbarButtonType.Primary,
                    label: this.form.controls.id.value ? "Update" : "Submit",
                    disabled: () => this.form.invalid || !this.form.dirty,
                    action: () => this.submit(),
                },
            ],
        });
    }

    ngAfterViewInit(): void {
        this.focusInput()?.nativeElement.focus();
        this.cdr.detectChanges();
    }

    onSplitTypeChanged(event?: MatButtonToggleChange) {
        const type = event?.source.value ?? this.selectedSplitType;
        if (type === this.splitType.ByShare) {
            this.bottomSheet
                .open(PaidByShareComponent, {
                    disableClose: true,
                    data: {
                        members: this.$group()?.activeMembers ?? [],
                        userShare: { ...this.userShare },
                    },
                })
                .afterDismissed()
                .subscribe((userShare) => {
                    this.userShare = userShare;
                    const sum = values(userShare).reduce(
                        (acc, share) => acc + share,
                        0,
                    );
                    this.form.controls.amount.setValue(sum);
                    this.form.markAsDirty();
                });
        } else if (type === this.splitType.Equally) {
            this.onAmountChange();
        }
    }

    onAmountChange() {
        const amount = this.form.controls.amount.value ?? 0;
        const members = this.$group()?.activeMembers;
        if (members?.length) {
            const share = amount / members.length;
            const userShare: Record<string, number> = {};
            members.forEach((member) => {
                userShare[member.id] = share;
            });

            this.userShare = userShare;
        }
    }

    openCategorySheet() {
        this.bottomSheet
            .open(CategorySelectorComponent, {
                data: this.$group()?.categories ?? [],
            })
            .afterDismissed()
            .subscribe((subCategory: SubCategory) => {
                this.selectedSubCategory = subCategory;
                this.form.controls.category.setValue(subCategory.name || "");
                this.form.markAsDirty();
            });
    }

    submit() {
        const { id, groupId, description, where, amount, expenseDate, paidBy } =
            this.form.value;
        if (
            !this.form.valid ||
            !groupId ||
            !expenseDate ||
            !paidBy ||
            !description
        ) {
            return;
        }

        const expense = {
            description,
            where,
            amount: +(amount ?? 0),
            category: this.selectedSubCategory?.id,
            expenseDate,
            paidBy,
            usersShare: this.userShare,
        } as Expense;

        if (id) {
            this.store.dispatch(ExpenseAction.update({ groupId, id, expense }));
        } else {
            this.store.dispatch(ExpenseAction.add({ groupId, expense }));
        }
    }
}
