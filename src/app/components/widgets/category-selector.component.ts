import { Component, inject } from "@angular/core";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";

import { categoriesByGroup } from "../../models/category.model";

@Component({
	selector: "app-category-selector",
	standalone: true,
	imports: [
		MatIconModule,
		MatDividerModule,
		MatButtonModule
	],
	template: `
        <div class="container">
            <span>Select Category</span>
            @for (group of groupCategories; track group) {
                <mat-divider></mat-divider>
                <div class="category-group">
                    @for (category of group.categories; track category) {
                        <div  class="category">
                            <button mat-icon-button (click)="onCategorySelected(category.id)">
                                <mat-icon>{{category.icon}}</mat-icon>
                            </button>
                            <span>{{category.name}}</span>
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

            .mat-icon {
                transform: scale(1.2);
            }

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
	protected groupCategories = categoriesByGroup;

	onCategorySelected(categoryId: number) {
		this.bottomSheetRef.dismiss(categoryId);
	}
}
