import { Component, Inject, inject } from "@angular/core";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";

import { Category, SubCategory } from "../../models/category.model";
import { DividerComponent } from "../shared/divider.component";

@Component({
	selector: "app-category-selector",
	standalone: true,
	imports: [
		MatIconModule,
		MatDividerModule,
		MatButtonModule,
		DividerComponent
	],
	template: `
		<div class="container">
			@for (category of data; track category) {
				<app-divider [text]="category.name"></app-divider>
				<div class="category-group">
					@for (subCategory of category.subCategories; track subCategory) {
						<div  class="category">
							<button mat-icon-button (click)="onCategorySelected(subCategory)">
								{{subCategory.icon}}
							</button>
							<span>{{subCategory.name}}</span>
						</div>
					}
				</div>
			}
		</div>
	`,
	styles: [`
		.container {
			margin: 16px;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.category-group {
			display: flex;
			gap: 16px;
			flex-wrap: wrap;

			.category {
				display: flex;
				flex-direction: column;
				align-items: center;
			}
		}
`]
})
export class CategorySelectorComponent {
	private bottomSheetRef = inject(MatBottomSheetRef<CategorySelectorComponent>);

	constructor(@Inject(MAT_BOTTOM_SHEET_DATA) protected data: Category[]) {}

	onCategorySelected(subCategory: SubCategory) {
		this.bottomSheetRef.dismiss(subCategory);
	}
}
