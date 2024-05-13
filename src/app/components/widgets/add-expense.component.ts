import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {CommonModule} from "@angular/common";
import {
	Component,
	ElementRef,
	inject,
	Inject,
	OnInit,
	Signal,
	ViewChild
} from "@angular/core";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import {MatChipInputEvent, MatChipsModule} from "@angular/material/chips";
import { provideNativeDateAdapter } from "@angular/material/core";
import {MatDatepickerModule} from "@angular/material/datepicker";
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import { filter, map, Observable, startWith } from "rxjs";

import {
	categoriesByGroup,
	Category,
	CategoryGroup,
	filterCategories,
	getCategoryById
} from "../../models/category.model";
import { Group } from "../../models/group.model";
import { GroupExpenseService } from "../../services/group-expense.service";
import { GroupService } from "../../services/group.service";
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
		MatAutocompleteModule,
		ReactiveFormsModule,
		MatInputModule,
		ReactiveFormsModule,
		MatChipsModule,
		MatSelectModule,
		MatDatepickerModule
	],
	providers:[provideNativeDateAdapter()],
	template: `
    <div>
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
              <mat-icon matTextPrefix>currency_rupee</mat-icon>
              <mat-label>Amount</mat-label>
              <input 
                matInput
                type="number"
                placeholder="0.00"
                min="0"
                [formControl]="form.controls.amount">
            </mat-form-field>          
          </div>

          <mat-form-field>
            <mat-label>Categories</mat-label>
            <mat-chip-grid #categoryChipGrid>
              @for (categoryId of selectedCategories; track categoryId) {
                <mat-chip-row (removed)="removeCategory(categoryId)">
                  <mat-icon matChipAvatar>{{getCategoryById(categoryId)?.icon}}</mat-icon>
                  {{getCategoryById(categoryId)?.name}}
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip-row>
              }
            </mat-chip-grid>
            <input #categoryInput
              matInput
              [matChipInputFor]="categoryChipGrid"
              [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
              placeholder="Add categories..."
              [formControl]="categoryFormControl"
              [matAutocomplete]="categoryAutoComplete" />
            <mat-autocomplete
              #categoryAutoComplete="matAutocomplete"
              (optionSelected)="categorySelected($event)" >
              @for (group of categoryGroupOptions | async; track group) {
                <mat-optgroup [label]="group.name">
                  @for (category of group.categories; track category) {
                    <mat-option [value]="category.id">
                      <mat-icon>{{category.icon}}</mat-icon>{{category.name}}
                    </mat-option>
                  }
                </mat-optgroup>
              }
            </mat-autocomplete>
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
  	paidBy: [this.userService.currentUser()?.uid, [Validators.required]],
  	expenseDate: [new Date(), [Validators.required]] 
  });
  protected categoryFormControl = new FormControl("");
  protected separatorKeysCodes: number[] = [ENTER, COMMA];
  protected categoryGroups = categoriesByGroup;
  protected categoryGroupOptions: Observable<CategoryGroup[]> | undefined;
  protected selectedCategories: number[] = [];
  protected getCategoryById = getCategoryById;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { $group: Signal<Group | undefined> }
  ) {}

  ngOnInit(): void {
  	this.categoryGroupOptions = this.categoryFormControl.valueChanges.pipe(
  		startWith(""),
  		filter(value => typeof value === "string"),
  		map(value => {
  			if(value) {
  				return categoriesByGroup
  					.map(group => ({ 
  						name: group.name, 
  						categories: filterCategories(group.categories, value)
  							.filter(c => this.selectedCategories.find(id => id !== c.id))
  					}))
  					.filter(group => group.categories.length > 0);
  			}
  			return categoriesByGroup;
  		})
  	);
  }

  async submit() {
  	const groupId = this.data.$group()?.uid;
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
  				categories: this.selectedCategories,
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

  categorySelected($event: MatAutocompleteSelectedEvent): void {
  	this.selectedCategories.push($event.option.value);
  	if(this.categoryInput) {
  		this.categoryInput.nativeElement.value = "";
  	}
  	this.categoryFormControl.setValue(null);
  }

  removeCategory(categoryId: number): void {
  	const index = this.selectedCategories.findIndex(id => id === categoryId);
  	if(index >= 0) {
  		this.selectedCategories.splice(index, 1);
  	}
  }
}
