import { CommonModule } from "@angular/common";
import {
	Component,
	inject,
	Input,
	OnDestroy,
	OnInit
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { ActivatedRoute, Router } from "@angular/router";
import {
	combineLatest,
	map,
	Observable,
	Subscription,
	switchMap
} from "rxjs";

import { categoriesByGroup, getCategoryById } from "../models/category.model";
import { Expense } from "../models/expense.model";
import { Group } from "../models/group.model";
import { GroupExpenseService } from "../services/group-expense.service";
import { GroupService } from "../services/group.service";
import { NotificationService } from "../services/notification.service";
import { UserService } from "../services/user.service";
import { getFirebaseErrorMessage } from "../utilities/firebase-errors";

import { CategorySelectorComponent } from "./category-selector.component";
import { LayoutComponent } from "./shared/layout.component";
import { PageNavHeaderComponent } from "./shared/page-nav-header.component";

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
		PageNavHeaderComponent,
		LayoutComponent,
	],
	providers: [provideNativeDateAdapter()],
	template: `
    <app-layout>
      <div section="header">
        <app-page-nav-header
            [backRoute]="['/group',  $currentGroup()?.uid ?? '']"
            title="Add Expense">
        </app-page-nav-header>
      </div>
      <div section="detail" class="detail-section">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field>
            <mat-label>Description</mat-label>
            <input matInput [formControl]="form.controls.description" />
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
                min="0"
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
                @for (user of $currentGroup()?.users; track user) {
                  <mat-option [value]="user?.uid">
                    {{user.name}}
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

      > button {
        width: 300px;
        text-align: center;
      }
    }
  `,
	],
})
export class ExpenseEditorComponent implements OnInit, OnDestroy {
	private readonly bottomSheet = inject(MatBottomSheet);
	private readonly formBuilder = inject(FormBuilder);
	private readonly groupService = inject(GroupService);
	private readonly groupExpenseService = inject(GroupExpenseService);
	private readonly notificationService = inject(NotificationService);
	private readonly userService = inject(UserService);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);

	private selectedCategory = getCategoryById(101);
	private expenseSubscription$$: Subscription | undefined;

	private group$ = this.route.paramMap.pipe(
		switchMap((params) =>
			this.groupService.currentGroup$(params.get("groupId") ?? "")
		)
	);

	private currentGroup$: Observable<Group> = combineLatest([
		this.group$,
		this.userService.user$,
	]).pipe(
		map(([group, currentUser]) => {
			return {
				...group,
				users: group.users.map(user => 
					user.uid === currentUser?.uid ? { ...user, name: "You" } : user
				),
			};
		})
	);

	protected readonly form = this.formBuilder.group({
		description: ["", Validators.required],
		amount: this.formBuilder.control<number | null>(null, {
			validators: [Validators.required],
		}),
		category: this.selectedCategory?.name,
		paidBy: [this.userService.currentUser()?.uid, Validators.required],
		expenseDate: [new Date(), Validators.required],
	});
	protected categoryGroups = categoriesByGroup;
	protected getCategoryById = getCategoryById;
	protected $currentGroup = toSignal(this.currentGroup$);

  @Input() groupId: string | undefined;
  @Input() id: string | undefined;

  ngOnInit(): void {
  	if (this.groupId && this.id) {
  		this.expenseSubscription$$ = this.groupExpenseService.getExpense$(this.groupId, this.id)
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
  	if (this.expenseSubscription$$) {
  		this.expenseSubscription$$.unsubscribe();
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

  async submit() {
  	const { description, amount, expenseDate, paidBy } = this.form.value;
  	if (!this.form.valid || !this.groupId || !expenseDate || !paidBy || !description) {
  		return;
  	}

  	const expense = {
  		description,
  		amount: +(amount ?? 0),
  		category: this.selectedCategory?.id,
  		expenseDate,
  		paidBy,
  	} as Expense;

  	try {
  		await (this.id
		  ? this.groupExpenseService.updateExpense(this.groupId, this.id, expense)
		  : this.groupExpenseService.addExpense(this.groupId, expense)
  		);
  		this.router.navigate(["/group", this.groupId]);
	  } catch (err) {
  		this.notificationService.error(getFirebaseErrorMessage(err));
	  }
  }

  async deleteExpense() {
  	if (!this.groupId || !this.id) {
  		return;
  	}

  	try {
  		await this.groupExpenseService.deleteExpense(this.groupId, this.id);
  		this.router.navigate(["/group", this.groupId]);
  	} catch (err) {
  		this.notificationService.error(getFirebaseErrorMessage(err));
  	}
  }
}
