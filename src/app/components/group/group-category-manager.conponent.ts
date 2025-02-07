import { CommonModule } from "@angular/common";
import {
	Component,
	inject,
	Input,
	OnInit,
	TemplateRef,
	ViewChild
} from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { Store } from "@ngrx/store";
import { filter, map, Observable, startWith } from "rxjs";

import { Category, SubCategory } from "../../models/category.model";
import { Group } from "../../models/group.model";
import { DialogService } from "../../services/dialog.service";
import { GroupAction } from "../../store/group/group.action";
import { DialogComponent } from "../shared/dialog.component";
import { DisableControlDirective } from "../shared/disable-control.directive";

@Component({
	selector: "app-group-category-manager",
	standalone: true,
	imports: [
		CommonModule,
		MatCardModule,
		MatIconModule,
		MatButtonModule,
		MatFormFieldModule,
		ReactiveFormsModule,
		MatInputModule,
		MatSelectModule,
		MatAutocompleteModule,
		DisableControlDirective
	],
	template: `
		<mat-card>
			<mat-card-header>
				<mat-card-subtitle>Categories:</mat-card-subtitle>
				<button mat-mini-fab color="primary" (click)="openAddCategoryDialog()">
					<mat-icon>add</mat-icon>
				</button>
			</mat-card-header>
			<mat-card-content>
				@for (category of group?.categories ?? []; track category;) {
					@for (subCategory of category.subCategories; track subCategory;) {
						<div class="category-row">
							<span>{{category.name}}</span>
							<span>{{subCategory.name}}</span>
							<span>{{subCategory.icon}}</span>
						</div>
					}
				}
			</mat-card-content>
		</mat-card>

		<ng-template #addCategoryDialog>
			<h2 class="title">Add new category</h2>
			<form [formGroup]="form" (ngSubmit)="saveCategory()">
				<mat-form-field>
					<mat-label>Category</mat-label>
					<input matInput
						formControlName="categoryName"
						type="text"
						[matAutocomplete]="category"
						placeholder="Type to add or search category" />
					<mat-autocomplete
						autoActiveFirstOption 
						#category="matAutocomplete"
						(optionSelected)="onSelectedCategoryChange($event)">
							@for (category of filteredCategories | async; track category) {
								<mat-option [value]="category">{{category.name}}</mat-option>
							}

							@if (showAddCategoryOption) {
								<mat-option [value]="form.controls.categoryName.value">
									<mat-icon>add</mat-icon> Add "{{form.controls.categoryName.value}}"
								</mat-option>
							}
					</mat-autocomplete>
					<mat-icon matSuffix>arrow_drop_down</mat-icon>
				</mat-form-field>

				<mat-form-field>
					<mat-label>Sub Category</mat-label>
					<input matInput
						formControlName="subCategoryName"
						type="text"
						[matAutocomplete]="subCategory"
						[appDisableControl]="!form.controls.categoryName.value"
						placeholder="Type to add or search sub-category" />
					<mat-autocomplete
						autoActiveFirstOption 
						#subCategory="matAutocomplete"
						(optionSelected)="onSelectedSubCategoryChange($event)">
							@for (subCategory of filteredSubCategories | async; track subCategory) {
								<mat-option [value]="subCategory">{{subCategory.name}}</mat-option>
							}

							@if (showAddSubCategoryOption) {
								<mat-option [value]="form.controls.subCategoryName.value">
									<mat-icon>add</mat-icon> Add "{{form.controls.subCategoryName.value}}"
								</mat-option>
							}
					</mat-autocomplete>
					<mat-icon matSuffix>arrow_drop_down</mat-icon>
				</mat-form-field>

				<mat-form-field>
					<mat-label>emojis</mat-label>
					<input matInput
						[appDisableControl]="!form.controls.subCategoryName.value"
						formControlName="icon" />
				</mat-form-field>

				<div class="action-buttons">
					<button mat-raised-button (click)="closeAddCategoryDialog()">Cancel</button>
					<button type="submit"
							mat-raised-button 
							color="primary"
							[disabled]="form.invalid">
						Save
					</button>
				</div>
			</form>
		</ng-template>
	`,
	styles: [`
		.mat-mdc-card {
			width: 100%;
			max-height: 300px;
			border-radius: 24px;

			.mat-mdc-card-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
			}

			.mat-mdc-card-content {
				display: flex;
				flex-direction: column;
				overflow-y: auto;

				.category-row {
					display: flex;
					align-items: center;
					gap: 4px;
					justify-content: space-between;
					margin: 4px 16px 0 0;
				}
			}
		}

		.action-buttons {
			display: flex;
			gap: 16px;
			justify-content: center;
		}

		.title {
			text-align: center
		}
	`]
})
export class GroupCategoryManagerComponent implements OnInit {
	private readonly dialog = inject(DialogService);
	private readonly fb = inject(NonNullableFormBuilder);
	private readonly store = inject(Store);

	private addCategorydialog: MatDialogRef<DialogComponent, unknown> | undefined;

	protected form = this.fb.group({
		categoryId: [undefined as number | undefined],
		categoryName: ["", Validators.required],
		subCategoryId: [undefined as number | undefined],
		subCategoryName: ["", Validators.required],
		icon: ["", Validators.required]
	});

	protected filteredCategories: Observable<Category[]> | undefined;
	protected showAddCategoryOption = false;
	protected filteredSubCategories: Observable<SubCategory[]> | undefined;
	protected showAddSubCategoryOption = false;

	@ViewChild("addCategoryDialog") addCategoryDialog: TemplateRef<unknown> | undefined;

	@Input() group: Group | undefined;

	ngOnInit(): void {
		this.filteredCategories = this.form.controls.categoryName.valueChanges.pipe(
			startWith(""),
			filter(value => typeof value === "string"),
			map(value => {
				const filterValue = (value || "").toLowerCase();
				const filtered = this.group?.categories.filter(category => category.name.toLowerCase().includes(filterValue)) ?? [];

				this.showAddCategoryOption = filtered.length === 0 && filterValue.trim().length > 0;

				return filtered;
			})
		);

		this.filteredSubCategories = this.form.controls.subCategoryName.valueChanges.pipe(
			startWith(""),
			filter(value => typeof value === "string"),
			map(value => {
				const filterValue = (value || "").toLowerCase();
				let filtered = [] as SubCategory[];
				if(this.form.controls.categoryId.value) {
					filtered = this.group?.categories
						.find(c => c.id === this.form.controls.categoryId.value)?.subCategories
						.filter(sc => sc.name.toLowerCase().includes(filterValue)) ?? [];
				}

				this.showAddSubCategoryOption = filtered.length === 0 && filterValue.trim().length > 0;

				return filtered;
			})
		);
	}

	protected openAddCategoryDialog(): void {
		this.addCategorydialog = this.dialog.open({
			data: {
				template: this.addCategoryDialog
			},
			disableClose: true
		});
	}

	protected onSelectedCategoryChange($event: MatAutocompleteSelectedEvent) {
		if(typeof $event.option.value === "string") {
			this.form.controls.categoryName.setValue($event.option.value as string);
		} else {
			const category = $event.option.value as Category;
			this.form.patchValue({
				categoryId: category.id,
				categoryName: category.name
			});
		}
	}

	protected onSelectedSubCategoryChange($event: MatAutocompleteSelectedEvent) {
		if(typeof $event.option.value === "string") {
			this.form.controls.subCategoryName.setValue($event.option.value as string);
		} else {
			const subCategory = $event.option.value as SubCategory;
			this.form.patchValue({
				subCategoryId: subCategory.id,
				subCategoryName: subCategory.name,
				icon: subCategory.icon
			});
		}
	}

	protected saveCategory(): void {
		const { categoryId, categoryName, subCategoryName, icon } = this.form.value;
		if(!this.group?.id || !subCategoryName || !icon) {
			return;
		}

		this.store.dispatch(GroupAction.addCategory({ groupId: this.group.id, subCategoryName, icon, categoryId, categoryName }));

		this.closeAddCategoryDialog();
	}

	protected closeAddCategoryDialog(): void {
		this.form.reset();
		this.addCategorydialog?.close();
	}
}