import { CommonModule } from "@angular/common";
import {
	Component,
	ElementRef,
	inject,
	Inject,
	OnInit,
	Signal,
	ViewChild
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

import {
	categoriesByGroup,
	getCategoryById
} from "../../models/category.model";
import { Group } from "../../models/group.model";
import { GroupExpenseService } from "../../services/group-expense.service";
import { NotificationService } from "../../services/notification.service";
import { UserService } from "../../services/user.service";
import { getFirebaseErrorMessage } from "../../utilities/firebase-errors";

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
		MatDatepickerModule
	],
	providers:[provideNativeDateAdapter()],
	template: `
    <div class="header-section">
      <button mat-icon-button (click)="close()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h2>Add expense</h2>
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

        <mat-form-field>
          <mat-label>Categories</mat-label>
          <mat-select [formControl]="form.controls.category">
            <mat-option>-- None --</mat-option>
            @for (group of categoryGroups; track group) {
              <mat-optgroup [label]="group.name">
                @for (category of group.categories; track category) {
                  <mat-option [value]="category.id">
                    <mat-icon>category.icon</mat-icon>{{category.name}}
                  </mat-option>
                }
              </mat-optgroup>
            }
          </mat-select>
        </mat-form-field>

        <div class="row">
          <mat-form-field>
            <mat-label>Paid by</mat-label>
            <mat-select [formControl]="form.controls.paidBy">
              @for (user of data.$group()?.users; track user) {
                <mat-option [value]="user?.uid">
                  {{userService.currentUser()?.uid === user?.uid  ? 'You' : user?.name}}
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
  .header-section {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;

    > h2 {
      margin-top: 8px;
      text-align: center;
    }
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
export class AddExpenseComponent implements OnInit {
  @ViewChild("categoryInput") categoryInput: ElementRef<HTMLInputElement> | undefined;

  private readonly bottomSheetRef = inject(MatBottomSheetRef<AddExpenseComponent>);
  private readonly formBuilder = inject(FormBuilder);
  private readonly groupExpenseService = inject(GroupExpenseService);
  private readonly notificationService = inject(NotificationService);

  protected readonly userService = inject(UserService);

  protected readonly form = this.formBuilder.group({
  	description: ["", [Validators.required]],
  	amount: ["", [Validators.required]],
  	category: [undefined],
  	paidBy: [this.userService.currentUser()?.uid, [Validators.required]],
  	expenseDate: [new Date(), [Validators.required]] 
  });
  protected categoryGroups = categoriesByGroup;
  protected getCategoryById = getCategoryById;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { $group: Signal<Group | undefined> }
  ) {}

  ngOnInit(): void { }

  async submit() {
  	const groupId = this.data.$group()?.uid;
  	const { description, amount, category, expenseDate, paidBy} = this.form.value;
  	if(this.form.invalid || !groupId || !expenseDate || !paidBy || !description) {
  		return;
  	}

  	try {
  		await this.groupExpenseService.addExpense(
  			groupId,
  			{
  				description: description,
  				amount: +(amount ?? 0),
  				category: category ? +category : undefined,
  				expenseDate,
  				paidBy
  			}
  		);

  		this.bottomSheetRef.dismiss();
  	} catch (err) {
  		this.notificationService.error(getFirebaseErrorMessage(err));
  	}
  }

  close(): void {
    this.bottomSheetRef.dismiss();
  }
}
