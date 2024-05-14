import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

import { Category, categoriesByGroup, getCategoryById } from "../models/category.model";
import { Group } from "../models/group.model";
import { GroupExpenseService } from "../services/group-expense.service";
import { NotificationService } from "../services/notification.service";
import { UserService } from "../services/user.service";
import { getFirebaseErrorMessage } from "../utilities/firebase-errors";
import { toSignal } from "@angular/core/rxjs-interop";
import { combineLatest, map, Observable, switchMap } from "rxjs";
import { CategorySelectorComponent } from "./category-selector.component";
import { ActivatedRoute, Router } from "@angular/router";
import { GroupService } from "../services/group.service";
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
    PageNavHeaderComponent
	],
	providers:[provideNativeDateAdapter()],
	template: `
    <div class="header-section">
      <app-page-nav-header
          [backRoute]="['/group',  $currentGroup()?.uid ?? '']" 
          title="Add Expense">
      </app-page-nav-header>
    </div>

    <div class="detail-section">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="row">
          <mat-form-field>
            <mat-label>Description</mat-label>
            <input matInput [formControl]="form.controls.description" />
          </mat-form-field>
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
        </div>

        <div class="row">
          <mat-form-field>
            <mat-label>Category</mat-label>
            <input matInput
              [formControl]="form.controls.category"
              (click)="openCategorySheet()"
              (keyup)="openCategorySheet()" readonly />
            <mat-icon matSuffix (click)="openCategorySheet()">keyboard_arrow_down</mat-icon>
            <!-- <mat-select [formControl]="form.controls.category">
              <mat-option>-- None --</mat-option>
              @for (group of categoryGroups; track group) {
                <mat-optgroup [label]="group.name">
                  @for (category of group.categories; track category) {
                    <mat-option [value]="category.id">
                      <mat-icon>{{category.icon}}</mat-icon>
                      {{category.name}}
                    </mat-option>
                  }
                </mat-optgroup>
              }
            </mat-select> -->
          </mat-form-field>
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
        </div>

        <div class="row">
          <mat-form-field>
            <input matInput [matDatepicker]="dp" [formControl]="form.controls.expenseDate">
            <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
            <mat-datepicker #dp></mat-datepicker>
          </mat-form-field>
        </div>

        <div class="button-group">
          <button 
            type="submit"
            class="rounded-button"
            mat-raised-button 
            color="primary"
            [disabled]="form.invalid">Submit</button>
        </div>
      </form>
    </div>
  `,
	styles: [`
    .header-section, .detail-section {
      margin: 16px;
    }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 16px;
  }

  .amount-input {
    text-align: right;
  }

  .button-group {
    display: flex;
    justify-content: center;
  }
  `]
})
export class ExpenseEditorComponent {
	private readonly bottomSheet = inject(MatBottomSheet);
  private readonly formBuilder = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly groupExpenseService = inject(GroupExpenseService);
  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private selectedCategory = getCategoryById(101);

  private group$ = this.route.paramMap.pipe(
		switchMap(params => this.groupService.currentGroup$(params.get("groupId") ?? ""))
	);

  private currentGroup$: Observable<Group> = combineLatest([
    this.group$,
    this.userService.user$
  ]).pipe(
    map(([group, currentUser]) => {
      group.users = group.users.map(user => {
        if(user.uid === currentUser?.uid) {
          return { ...user, name: "You" };
        }
        return user;
      })
      return group;
    })
  );

  protected readonly form = this.formBuilder.group({
  	description: ["", [Validators.required]],
  	amount: ["", [Validators.required]],
  	category: [""],
  	paidBy: [this.userService.currentUser()?.uid, [Validators.required]],
  	expenseDate: [new Date(), [Validators.required]] 
  });
  protected categoryGroups = categoriesByGroup;
  protected getCategoryById = getCategoryById;
  protected $currentGroup = toSignal(this.currentGroup$);

  ngOnInit() {
    this.openCategorySheet()
  }

  openCategorySheet() {
    const bottomSheetRef = this.bottomSheet.open(CategorySelectorComponent);
    bottomSheetRef.afterDismissed().subscribe(selectedCategoryId => {
      if(selectedCategoryId && +selectedCategoryId > 0) {
        this.selectedCategory = getCategoryById(selectedCategoryId);
        this.form.controls.category.setValue(this.selectedCategory?.name ?? "");
      }
    })
  }

  async submit() {
  	const groupId = this.$currentGroup()?.uid;
  	const { description, amount, expenseDate, paidBy} = this.form.value;
  	if(this.form.invalid || !groupId || !expenseDate || !paidBy || !description) {
  		return;
  	}

  	try {
  		await this.groupExpenseService.addExpense(
  			groupId,
  			{
  				description: description,
  				amount: +(amount ?? 0),
  				category: this.selectedCategory?.id,
  				expenseDate,
  				paidBy
  			}
  		);

      this.router.navigate(["/group", groupId]);
  	} catch (err) {
  		this.notificationService.error(getFirebaseErrorMessage(err));
  	}
  }
}
