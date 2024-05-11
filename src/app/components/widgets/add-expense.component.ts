import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {MatAutocompleteSelectedEvent, MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';
import { Observable, filter, map, startWith } from 'rxjs';
import {CommonModule} from '@angular/common';
import { Category, CategoryGroup, categoriesByGroup, filterCategories } from '../../models/category.model';

@Component({
  selector: 'app-add-expense',
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
    MatChipsModule
  ],
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
              <input matInput formControlName="description" />
            </mat-form-field>
            <mat-form-field appearance="fill" floatLabel="always">
              <mat-icon matTextPrefix>currency_rupee</mat-icon>
              <mat-label>Amount</mat-label>
              <input 
                matInput 
                placeholder="0.00">
            </mat-form-field>          
          </div>

          <mat-form-field>
            <mat-label>Categories</mat-label>
            <mat-chip-grid #categoryChipGrid>
              @for (category of selectedCategories; track category) {
                <mat-chip-row (removed)="removeCategory(category)">
                  <mat-icon matChipAvatar>{{category.icon}}</mat-icon>
                  {{category.name}}
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
              [formControl]="form.controls.category"
              [matAutocomplete]="categoryAutoComplete" />
            <mat-autocomplete
              #categoryAutoComplete="matAutocomplete"
              (optionSelected)="categorySelected($event)" >
              @for (group of categoryGroupOptions | async; track group) {
                <mat-optgroup [label]="group.name">
                  @for (category of group.categories; track category) {
                    <mat-option [value]="category">
                      <mat-icon>{{category.icon}}</mat-icon>{{category.name}}
                    </mat-option>
                  }
                </mat-optgroup>
              }
            </mat-autocomplete>
          </mat-form-field>
          
          <div class="button-group">
            <button mat-flat-button (click)="close()">Close</button>
            <button 
              type="submit"
              class="rounded-button"
              mat-raised-button 
              color="primary">Submit</button>
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
      display: flex;
      gap: 16px;

      .mat-form-field {
        flex-basis: 50%;
      }
    }

    .button-group {
      display: flex;
      gap: 8px;
      justify-content: center;
    }
  `]
})
export class AddExpenseComponent implements OnInit {
  @ViewChild('categoryInput') categoryInput: ElementRef<HTMLInputElement> | undefined;
  
  private readonly bottomSheetRef = inject(MatBottomSheetRef<AddExpenseComponent>);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.group({
    description: ["", [Validators.required]],
    category: [""],
    amount: [0, [Validators.required]]
  });
  protected separatorKeysCodes: number[] = [ENTER, COMMA];
  protected categoryGroups = categoriesByGroup;
  protected categoryGroupOptions: Observable<CategoryGroup[]> | undefined;
  protected selectedCategories: Category[] = [];

  ngOnInit(): void {
    this.categoryGroupOptions = this.form.controls.category.valueChanges.pipe(
      startWith(""),
      filter(value => typeof value === 'string'),
      map(value => {
        if(value) {
          return categoriesByGroup
            .map(group => ({ name: group.name, categories: filterCategories(group.categories, value)}))
            .filter(group => group.categories.length > 0)
        }
        return categoriesByGroup;
      })
    )
  }

  submit(): void {

  }

  close(): void {
    this.bottomSheetRef.dismiss();
  }

  categorySelected($event: MatAutocompleteSelectedEvent): void {
    this.selectedCategories.push($event.option.value);
    if(this.categoryInput) {
      this.categoryInput.nativeElement.value = "";
    }
    this.form.controls.category.setValue(null);
  }

  removeCategory(category: Category): void {
    const index = this.selectedCategories.findIndex(c => c.name === category.name);
    if(index >= 0) {
      this.selectedCategories.splice(index, 1);
    }
  }
}
