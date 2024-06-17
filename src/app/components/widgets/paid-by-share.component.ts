import { Component, Inject, inject } from "@angular/core";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { GroupMember } from "../../models/group.model";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";

@Component({
	selector: "app-paid-by-share",
	standalone: true,
	imports: [
		FormsModule,
		MatButtonModule,
		MatInputModule
	],
	template: `
		<h3 class="heading">Shares</h3>
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

		<div class="btn-group">
			<button mat-raised-button
				class="rounded" 
				color="primary" 
				(click)="close()">Submit
			</button>
		</div>
	`,
	styles: [`
		.heading {
			text-align: center;
		}

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
		this.bottomSheet.dismiss();
	}
}