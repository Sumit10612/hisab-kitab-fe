import { CommonModule } from "@angular/common";
import {
	AfterViewInit,
	Component,
	ElementRef,
	inject,
	OnInit,
	ViewChild
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatButtonToggleChange, MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { Store } from "@ngrx/store";
import { pick, uniq, values } from "lodash-es";
import { filter, switchMap, tap } from "rxjs";

import { DEFAULT_CATEGORY, SubCategory } from "../models/category.model";
import { Expense, SplitType } from "../models/expense.model";
import { Group, GroupMember, GroupType } from "../models/group.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { RouterSelector } from "../store/app.selector";
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
		PaidByShareComponent
	],
	providers: [provideNativeDateAdapter()],
	template: `
		@if (expense$ | async) {}
		<app-layout [pageTitle]="(form.controls.id.value ? 'Update' : 'Add') + ' an expense'"  headerHeight="48px">
			<div section="detail" class="detail-section">
				<form [formGroup]="form">
					<div class="row">
						<mat-form-field>
							<mat-label>Paid by</mat-label>
							<mat-select [formControl]="form.controls.paidBy">
								@for (member of members; track member) {
									<mat-option [value]="member.id">
										{{member.name}}
									</mat-option>
								}
							</mat-select>
						</mat-form-field>
						<mat-form-field>
							<input matInput [matDatepicker]="dp" [formControl]="form.controls.expenseDate">
							<mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
							<mat-datepicker #dp></mat-datepicker>
						</mat-form-field>
					</div>

					<mat-form-field>
						<input matInput placeholder="What is this expense for?" [formControl]="form.controls.description" #focusInput />
					</mat-form-field>
					<mat-form-field>
						<input matInput placeholder="Where did you pay this?" [formControl]="form.controls.where" />
					</mat-form-field>

					@if (form.controls.groupType.value === groupType.SpiltExpense) {
						<div class="shares-tab">
							<mat-button-toggle-group
								[(value)]="selectedSplitType"
								hideSingleSelectionIndicator="true"
								(change)="onSplitTypeChanged($event)">
								<mat-button-toggle [value]="splitType.Equally">Split equally</mat-button-toggle>
								<mat-button-toggle [value]="splitType.ByShare">By share</mat-button-toggle>
							</mat-button-toggle-group>
						</div>
					}

					<div class="row">
						<mat-form-field appearance="fill" floatLabel="always">
							<mat-label>Amount</mat-label>
							<span matTextPrefix>&#8377;</span>
							<input
								class="amount-input"
								matInput
								type="number"
								placeholder="0.00"
								[readonly]="selectedSplitType !== splitType.Equally"
								[formControl]="form.controls.amount"
								(change)="onAmountChange()"
								(click)="onSplitTypeChanged()"
								(keyup)="onSplitTypeChanged()">
						</mat-form-field>
						<mat-form-field>
							<mat-label>Category</mat-label>
							<input matInput
							[formControl]="form.controls.category"
							(click)="openCategorySheet()"
							(keyup)="openCategorySheet()" readonly />
							<mat-icon matSuffix (click)="openCategorySheet()">arrow_drop_down</mat-icon>
						</mat-form-field>
					</div>
				</form>

				@if (form.controls.groupType.value === groupType.SpiltExpense) {
					<div class="shares">
						@for (member of members; track member) {
							<div class="shares-share" (click)="onSplitTypeChanged()">
								<span>{{member.name.split(' ')[0]}}</span>
								<span>&#8377;{{userShare[member.id] || 0 | number: '1.2-2'}}</span>
							</div>
						}
					</div>
				}
			</div>
		</app-layout>
	`,
	styles: [`
		.detail-section {
			margin: 32px 16px;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;

			.row {
				display: grid;
				grid-template-columns: 1fr 1fr;
				grid-gap: 16px;
			}

			.mat-button-toggle-group {
				height: 32px;
				border-radius: 16px;
				align-items: center;
			}

			.amount-input {
				text-align: right;
			}

			.shares-tab {
				display: flex;
				padding-bottom: 24px;
				justify-content: center;
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
	]
})
export class ExpenseEditorComponent implements OnInit, AfterViewInit {
	private readonly bottomSheet = inject(MatBottomSheet);
	private readonly formBuilder = inject(FormBuilder);
	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly store = inject(Store);

	private selectedSubCategory = DEFAULT_CATEGORY.subCategories[0];
	private group: Group | undefined;

	protected groupType = GroupType;
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
	protected splitType = SplitType;
	protected selectedSplitType = SplitType.Equally;
	protected userShare: Record<string, number> = {};
	protected expense$ = this.store.select(RouterSelector.selectParams).pipe(
		switchMap(params => this.store.select(GroupSelector.selectGroup(params["groupId"])).pipe(
			filter(group => !!group),
			switchMap((group) => this.store.select(ExpenseSelector.selectExpense(params["id"])).pipe(
				tap(expense => {
					const subCategory = group?.categories
						.flatMap(category => category.subCategories)
						.find(subCat => subCat.id === expense?.category);
					if(subCategory) {
						this.selectedSubCategory = subCategory;
					}

					this.group = group;
					this.userShare = expense?.usersShare ?? {};
					this.form.patchValue({
						...expense,
						category: this.selectedSubCategory.name,
						paidBy: expense ? expense.paidBy : this.currentUser?.id,
						groupId: group?.id,
						groupType: group?.groupType
					});

					if (uniq(values(expense?.usersShare)).length > 1) {
						this.selectedSplitType = this.splitType.ByShare;
					}
				})
			))
		))
	);

	@ViewChild("focusInput") focusInput?: ElementRef;

	protected get members(): GroupMember[] {
		return values(pick(this.group?.members ?? {}, this.group?.memberIds ?? []));
	}

	protected get currentUser(): GroupMember | undefined {
		return this.members.find(m => m.name === "You");
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
							this.store.dispatch(ExpenseAction.remove({ groupId, id }));
						}
					}
				},
				{
					type: ToolbarButtonType.Primary,
					label: this.form.controls.id.value ? "Update" : "Submit",
					disabled: () => this.form.invalid || !this.form.dirty,
					action: () => this.submit()
				}
			]
		});
	}

	ngAfterViewInit(): void {
		this.focusInput?.nativeElement.focus();
	}

	onSplitTypeChanged(event?: MatButtonToggleChange) {
		const type = event?.source.value ?? this.selectedSplitType;
		if (type === this.splitType.ByShare) {
			this.bottomSheet.open(PaidByShareComponent, {
				disableClose: true,
				data: {
					members: this.members,
					userShare: { ...this.userShare }
				}
			}).afterDismissed().subscribe((userShare) => {
				this.userShare = userShare;
				const sum = values(userShare).reduce((acc, share) => acc + share, 0);
				this.form.controls.amount.setValue(sum);
				this.form.markAsDirty();
			});
		} else if (type === this.splitType.Equally) {
			this.onAmountChange();
		}
	}

	onAmountChange() {
		const amount = this.form.controls.amount.value;
		if (amount && this.members?.length) {
			const share = amount / this.members.length;
			const userShare: Record<string, number> = {};
			this.members.forEach(member => {
				userShare[member.id] = share;
			});

			this.userShare = userShare;
		}
	}

	openCategorySheet() {
		this.bottomSheet.open(CategorySelectorComponent, {
			data: this.group?.categories ?? []
		}).afterDismissed().subscribe((subCategory: SubCategory) => {
			this.selectedSubCategory = subCategory;
			this.form.controls.category.setValue(subCategory.name || "");
			this.form.markAsDirty();
		});
	}

	submit() {
		const { id, groupId, description, where, amount, expenseDate, paidBy } = this.form.value;
		if (!this.form.valid || !groupId || !expenseDate || !paidBy || !description) {
			return;
		}

		const expense = {
			description,
			where,
			amount: +(amount ?? 0),
			category: this.selectedSubCategory?.id,
			expenseDate,
			paidBy,
			usersShare: this.userShare
		} as Expense;

		if (id) {
			this.store.dispatch(ExpenseAction.update({ groupId, id, expense }));
		} else {
			this.store.dispatch(ExpenseAction.add({ groupId, expense }));
		}
	}
}
