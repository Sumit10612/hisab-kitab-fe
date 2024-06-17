import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { Store } from "@ngrx/store";
import { filter, switchMap, tap } from "rxjs";

import { categoriesByGroup, getCategoryById } from "../models/category.model";
import { Expense, SplitType } from "../models/expense.model";
import { GroupMember, GroupType } from "../models/group.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { ExpenseAction } from "../store/expense/expense.action";
import { ExpenseSelector } from "../store/expense/expense.selector";
import { GroupSelector } from "../store/group/group.selector";

import { CategorySelectorComponent } from "./widgets/category-selector.component";
import { LayoutComponent } from "./shared/layout.component";
import { RouterSelector } from "../store/app.selector";
import { pick, values } from "lodash-es";
import { CommonModule } from "@angular/common";
import { MatButtonToggleChange, MatButtonToggleModule } from "@angular/material/button-toggle";
import { PaidByShareComponent } from "./widgets/paid-by-share.component";
import { MatCardModule } from "@angular/material/card";

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
		<app-layout [pageTitle]="(form.controls.id.value ? 'Update' : 'Add') + ' an expense'" headerHeight="176px">
			@if (form.controls.groupType.value === groupType.SpiltExpense) {
				<div section="header" class="header-section">
					<div class="split">
						<mat-label>Split:</mat-label>
						<mat-button-toggle-group [(value)]="selectedSplitType" (change)="onSplitTypeChanged($event)">
							<mat-button-toggle [value]="splitType.Equally">Equally</mat-button-toggle>
							<mat-button-toggle [value]="splitType.ByShare">By share</mat-button-toggle>
						</mat-button-toggle-group>
					</div>
					<div class="shares">
						@for (member of members; track member) {
							<mat-card>
								<div class="shares-share">
									<span>{{member.name.split(' ')[0]}}</span>
									<span>&#8377;{{userShare[member.id] || 0 | number: '1.2-2'}}</span>
								</div>
							</mat-card>
						}
					</div>
				</div>
			}

			<div section="detail" class="detail-section">
				<form [formGroup]="form">
					<mat-form-field>
						<mat-label>Description</mat-label>
						<input matInput [formControl]="form.controls.description" />
					</mat-form-field>
					<mat-form-field>
						<mat-label>Paid at</mat-label>
						<input matInput [formControl]="form.controls.where" />
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
								[readonly]="selectedSplitType != splitType.Equally"
								[formControl]="form.controls.amount"
								(change)="onAmountChange()">
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
							<mat-hint>MM/DD/YYYY</mat-hint>
							<mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
							<mat-datepicker #dp></mat-datepicker>
						</mat-form-field>
					</div>
				</form>
			</div>
		</app-layout>
	`,
	styles: [`
		.header-section {
			.split {
				display: flex;
				align-items: center;
				gap: 16px;

				> mat-label {
					flex: 1;
				}

				.mat-button-toggle-group {
					height: 32px;
					border-radius: 16px;
					align-items: center;
				}
			}

			.split::after{
				content: '';
				flex: 1
			}

			.shares {
				padding: 16px 0;
				display: flex;
				gap: 8px;
				width: 100%;
				overflow-x: scroll;

				&-share {
					padding: 8px;
					display: flex;
					flex-direction: column;
					text-align: center;
				}
			}
		}

		.detail-section {
			margin: 32px 16px;
		}

		.row {
			display: grid;
			grid-template-columns: 1fr 1fr;
			grid-gap: 16px;
		}

		.amount-input {
			text-align: right;
		}
	`,
	],
})
export class ExpenseEditorComponent implements OnInit {
	private readonly bottomSheet = inject(MatBottomSheet);
	private readonly formBuilder = inject(FormBuilder);
	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly store = inject(Store);

	private selectedCategory = getCategoryById(101);

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
		category: this.selectedCategory?.name,
		paidBy: ["", Validators.required],
		expenseDate: [new Date(), Validators.required],
	});
	protected categoryGroups = categoriesByGroup;
	protected splitType = SplitType;
	protected selectedSplitType = SplitType.Equally;
	protected getCategoryById = getCategoryById;
	protected members?: GroupMember[];
	protected userShare: Record<string, number> = {};
	protected expense$ = this.store.select(RouterSelector.selectParams).pipe(
		switchMap(params => this.store.select(GroupSelector.selectGroup(params["groupId"])).pipe(
			filter(group => !!group),
			switchMap((group) => this.store.select(ExpenseSelector.selectExpense(params["id"])).pipe(
				tap(expense => {
					this.selectedCategory = getCategoryById(expense?.category ?? 101);
					this.members = values(pick(group?.members ?? {}, group?.memberIds ?? []));
					const currentUser = this.members?.find(m => m.name === "You");
					this.form.patchValue({
						...expense,
						category: this.selectedCategory?.name,
						paidBy: expense ? expense.paidBy : currentUser?.id,
						groupId: group?.id,
						groupType: group?.groupType
					});
				})
			))
		))
	);

	ngOnInit(): void {
		this.toolbar.configure({
			back: { visible: true },
			actionBtns: [
				{
					type: ToolbarButtonType.Warn,
					label: "Delete",
					visible: () => !!this.form.controls.id.value,
					action: () => {
						const { id, groupId } = this.form.value;
						if (id && groupId) {
							this.store.dispatch(ExpenseAction.remove({ groupId, id }))
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

	onSplitTypeChanged(event: MatButtonToggleChange) {
		if (event.source.value === this.splitType.ByShare) {
			this.bottomSheet.open(PaidByShareComponent, {
				disableClose: true,
				data: {
					members: this.members,
					userShare: this.userShare
				}
			}).afterDismissed().subscribe(() => {
				const sum = Object.values(this.userShare).reduce((acc, share) => acc + share, 0);
				this.form.controls.amount.setValue(sum);
			});
		} else if (event.source.value === this.splitType.Equally) {
			this.onAmountChange();
		}
	}

	onAmountChange() {
		const amount = this.form.controls.amount.value;
		if (amount && this.members?.length) {
			const share = amount / this.members.length;
			this.members.forEach(member => {
				this.userShare[member.id] = share;
			});
		}
	}

	openCategorySheet() {
		this.bottomSheet.open(CategorySelectorComponent)
			.afterDismissed()
			.subscribe(selectedCategoryId => {
				if (selectedCategoryId && typeof selectedCategoryId === "number" && selectedCategoryId > 0) {
					this.selectedCategory = getCategoryById(selectedCategoryId);
					this.form.controls.category.setValue(this.selectedCategory?.name || "");
				}
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
			category: this.selectedCategory?.id,
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
