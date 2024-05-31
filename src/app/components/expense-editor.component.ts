import { CommonModule } from "@angular/common";
import {
	Component,
	inject,
	Input,
	OnDestroy,
	OnInit
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { ActivatedRoute } from "@angular/router";
import {
	Subscription,
	switchMap,
	tap
} from "rxjs";

import { categoriesByGroup, getCategoryById } from "../models/category.model";
import { Expense } from "../models/expense.model";
import { GroupMember } from "../models/group.model";
import { ExpenseService } from "../services/expense.service";
import { GroupService } from "../services/group.service";
import { NavigationService } from "../services/navigation.service";
import { NotificationService } from "../services/notification.service";

import { CategorySelectorComponent } from "./category-selector.component";
import { LayoutComponent } from "./shared/layout.component";

@Component({
	selector: "app-add-expense",
	standalone: true,
	imports: [
		CommonModule,
		MatIconModule,
		MatButtonModule,
		MatFormFieldModule,
		ReactiveFormsModule,
		MatInputModule,
		ReactiveFormsModule,
		MatSelectModule,
		MatDatepickerModule,
		LayoutComponent,
	],
	providers: [provideNativeDateAdapter()],
	template: `
	<app-layout [showNav]="true" [pageTitle]="(id ? 'Update' : 'Add') + ' an expense'">
		<div section="detail" class="detail-section">
		<form [formGroup]="form" (ngSubmit)="submit()">
			<mat-form-field>
			<mat-label>Description</mat-label>
			<input matInput [formControl]="form.controls.description" />
			</mat-form-field>
			<mat-form-field>
			<mat-label>Where</mat-label>
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
				@for (member of (group$ | async)?.members; track member) {
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

			<div class="button-container">
			<button
				type="submit"
				class="rounded-button"
				mat-raised-button
				color="primary"
				[disabled]="form.invalid || !form.dirty">{{ id ? "Update" : "Submit" }} expense</button>            
			</div>
		</form>

		@if (id) {
			<div class="button-container">
			<button
				class="rounded-button button"
				mat-raised-button
				color="warn"
				(click)="deleteExpense()">
				Delete expense
			</button>
			</div>
		}
		</div>
	</app-layout>
	`,
	styles: [
		`
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

	.button-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		align-items: center;
		margin-top: 16px;
	}
	`,
	],
})
export class ExpenseEditorComponent implements OnInit, OnDestroy {
	private readonly bottomSheet = inject(MatBottomSheet);
	private readonly formBuilder = inject(FormBuilder);
	private readonly groupService = inject(GroupService);
	private readonly expenseService = inject(ExpenseService);
	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);
	private readonly route = inject(ActivatedRoute);

	private selectedCategory = getCategoryById(101);
	private expenseSubscription$$: Subscription | undefined;

	protected group$ = this.route.paramMap.pipe(
		switchMap(params =>
			this.groupService.get$(params.get("groupId") ?? "").pipe(
				tap(group => {
					const member = group.members.find(m => m.name === "You") as GroupMember;
					this.form.controls.paidBy.setValue(member.id);

					group.members = group.members.filter(m => m.active !== false);
				})
			)
		)
	);

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

	@Input() groupId: string = "";
	@Input() id: string | undefined;

	ngOnInit(): void {
		if (this.id) {
			this.expenseSubscription$$ = this.expenseService.get$(this.groupId, this.id)
				.subscribe((expense) => {
					if (expense.category) {
						this.selectedCategory = getCategoryById(expense.category);
					}
					this.form.patchValue({
						...expense,
						category: this.selectedCategory?.name,
					});
				});
		}
	}

	ngOnDestroy(): void {
		this.expenseSubscription$$?.unsubscribe();
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

	async submit() {
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

		try {
			this.notification.showLoading();
			await (this.id
				? this.expenseService.update(this.groupId, this.id, expense)
				: this.expenseService.add(this.groupId, expense)
			);

			this.navigation.navigateBack();
		} catch (err) {
			this.notification.firebaseError(err);
		} finally {
			this.notification.hideLoading();
		}
	}

	async deleteExpense() {
		if (!this.groupId || !this.id) {
			return;
		}

		try {
			this.notification.showLoading();
			await this.expenseService.delete(this.groupId, this.id);
			this.navigation.navigateBack();
		} catch (err) {
			this.notification.firebaseError(err);
		} finally {
			this.notification.hideLoading();
		}
	}
}
