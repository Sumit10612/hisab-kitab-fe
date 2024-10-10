import { CommonModule } from "@angular/common";
import { Component, Inject, Injector } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { isArray } from "lodash-es";

import { DialogButtonType, DialogData } from "../../models/dialog.model";

@Component({
	selector: "app-dialog",
	standalone: true,
	imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
	template: `
		<div class="dialog-header">
			@if (data.titleIcon) {
				<mat-icon>{{data.titleIcon}}</mat-icon>
			}
			<h4>{{data.title}}</h4>
		</div>

		<mat-dialog-content>
			@for (line of messageLines; track line) {
				<p>{{line}}</p>
			}

			@if (data.template) {
				<ng-container 
					[ngTemplateOutlet]="data.template"
					[ngTemplateOutletContext]="{ data: data.data }"
					[ngTemplateOutletInjector]="injector">
				</ng-container>
			}
		</mat-dialog-content>
		
		<mat-dialog-actions>
			@for (actionButton of data.actionButtons; track $index) {
				@if (actionButton.type === buttonType.Close) {
					<button mat-raised-button mat-dialog-close>{{actionButton.label}}</button>
				}

				@if(actionButton.type === buttonType.Primary) {
					<button mat-raised-button
						color="primary"
						[disabled]="actionButton.disabled?.(data.data)"
						(click)="actionButton.action?.(data.data)"
						mat-dialog-close>
						{{actionButton.label}}
					</button>
				}
			}
		</mat-dialog-actions>
	`,
	styles: [`
		.mat-mdc-dialog-actions {
			justify-content: flex-end;
			gap: 8px;
		}
		
		.mat-mdc-dialog-content {
			padding: 8px;
		}
	`]
})
export class DialogComponent {
	protected buttonType = DialogButtonType;

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: DialogData,
		public injector: Injector
	) { }

	get messageLines(): string[] {
		return isArray(this.data.message)
			? this.data.message
			: this.data.message
				? [this.data.message]
				: [];
	}
}