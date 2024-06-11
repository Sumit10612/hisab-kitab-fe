import {
	Component,
	inject,
	Input,
	OnDestroy,
	OnInit
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { Store } from "@ngrx/store";
import { combineLatest, Subscription } from "rxjs";

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

@Component({
	selector: "app-add-expense",
	standalone: true,
	imports: [
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
		<app-layout [pageTitle]="(id ? 'Update' : 'Add') + ' an expense'">
			<div section="detail" class="detail-section">
				<form [formGroup]="form" (ngSubmit)="submit()">
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
export class ExpenseEditorComponent implements OnInit, OnDestroy {
	private readonly bottomSheet = inject(MatBottomSheet);
	private readonly formBuilder = inject(FormBuilder);
	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly store = inject(Store);

	private selectedCategory = getCategoryById(101);
	private subscription$$?: Subscription;

	protected readonly form = this.formBuilder.group({
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

	@Input() groupId: string = "";
	@Input() id: string = "";

	ngOnInit(): void {
		this.toolbar.configure({
			back: { visible: true },
			actionBtns: [
				{
					type: ToolbarButtonType.Warn,
					label: "Delete",
					visible: () => !!this.id,
					action: () => this.store.dispatch(ExpenseAction.remove({ groupId: this.groupId, id: this.id }))
				},
				{
					type: ToolbarButtonType.Primary,
					label: this.id ? "Update" : "Submit",
					disabled: () => this.form.invalid || !this.form.dirty,
					action: () => this.submit()
				}
			]
		});

		this.subscription$$ = combineLatest([
			this.store.select(GroupSelector.select(this.groupId)),
			this.store.select(ExpenseSelector.select(this.id))
		]).subscribe(([group, expense]) => {
			this.members = group?.memberIds.map(id => group.members[id]).filter(member => member);
			const currentUser = this.members?.find(m => m.name === "You");
			if (expense?.category) {
				this.selectedCategory = getCategoryById(expense.category);
			}
			this.form.patchValue({
				...expense,
				category: this.selectedCategory?.name,
				paidBy: currentUser?.id
			});
		});
	}

	ngOnDestroy(): void {
		this.subscription$$?.unsubscribe();
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
		const { description, where, amount, expenseDate, paidBy } = this.form.value;
		if (!this.form.valid || !this.groupId || !expenseDate || !paidBy || !description) {
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

		if (this.id) {
			this.store.dispatch(ExpenseAction.update({ groupId: this.groupId, id: this.id, expense }));
		} else {
			this.store.dispatch(ExpenseAction.add({ groupId: this.groupId, expense }));
		}
	}
}
