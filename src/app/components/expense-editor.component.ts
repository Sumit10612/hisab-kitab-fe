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
import { Expense } from "../models/expense.model";
import { GroupMember } from "../models/group.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { ExpenseAction } from "../store/expense/expense.action";
import { ExpenseSelector } from "../store/expense/expense.selector";
import { GroupSelector } from "../store/group/group.selector";

import { CategorySelectorComponent } from "./category-selector.component";
import { LayoutComponent } from "./shared/layout.component";
import { RouterSelector } from "../store/app.selector";
import { pick, values } from "lodash-es";
import { CommonModule } from "@angular/common";

@Component({
	selector: "app-add-expense",
	standalone: true,
	imports: [
		CommonModule,
		MatIconModule,
		MatFormFieldModule,
		ReactiveFormsModule,
		MatInputModule,
		MatSelectModule,
		MatDatepickerModule,
		LayoutComponent,
	],
	providers: [provideNativeDateAdapter()],
	template: `
		@if (expense$ | async) {}
		<app-layout [pageTitle]="(form.controls.id.value ? 'Update' : 'Add') + ' an expense'">
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
								[formControl]="form.controls.amount">
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

	protected readonly form = this.formBuilder.group({
		id: "",
		groupId: "",
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
	protected getCategoryById = getCategoryById;
	protected members?: GroupMember[];
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
						groupId: group?.id
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
		} as Expense;

		if (id) {
			this.store.dispatch(ExpenseAction.update({ groupId, id, expense }));
		} else {
			this.store.dispatch(ExpenseAction.add({ groupId, expense }));
		}
	}
}
