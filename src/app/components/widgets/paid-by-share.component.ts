import { Component, Inject, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";

import { GroupMember } from "../../models/group.model";
import { MatCardModule } from "@angular/material/card";

@Component({
	selector: "app-paid-by-share",
	standalone: true,
	imports: [
		FormsModule,
		MatButtonModule,
		MatCardModule,
		MatInputModule
	],
	template: `
		<h3 class="heading">Shares</h3>
		<div class="container">
			<mat-card>
				<mat-card-content>
					@for (member of data.members; track member) {
						<div class="member-share-container">
							<mat-label>{{member.name}}</mat-label>
							<mat-form-field>
								<span matTextPrefix>&#8377;</span>
								<input type="number"
									class="amount"
									placeholder=0.00
									matInput
									[(ngModel)]="data.userShare[member.id]" />
							</mat-form-field>
						</div>
					}
				</mat-card-content>
			</mat-card>

			<div class="btn-group">
				<button mat-raised-button
						class="rounded" 
						color="primary" 
						(click)="close()">
					Submit
				</button>
			</div>
		</div>
	`,
	styles: [`
		.container {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.mat-mdc-card {
			width: 100%;
			border-radius: 24px;

			> mat-card-content {
				display: flex;
				flex-direction: column;			
				max-height: calc(100vh - 296px);
				overflow-y: auto;

				.member-share-container {
					display: grid;
					grid-gap: 16px;
					grid-template-columns: 1fr 1fr;
					align-items: center;

					.mat-mdc-form-field {
						text-align: right;
					}

					.amount {
						text-align: right;
					}
				}
			}
		}

		.heading {
			text-align: center;
		}

		.btn-group {
			display: flex;
			gap: 16px;
			justify-content: space-between;

			> button {
				border-radius: 16px;
				width: 100%;
			}
		}	
	`]
})
export class PaidByShareComponent {
	private bottomSheet = inject(MatBottomSheetRef<PaidByShareComponent>);

	constructor(
		@Inject(MAT_BOTTOM_SHEET_DATA) protected data: {
			members: GroupMember[];
			userShare: Record<string, number>;
		}) { }

	close() {
		this.bottomSheet.dismiss(this.data.userShare);
	}
}