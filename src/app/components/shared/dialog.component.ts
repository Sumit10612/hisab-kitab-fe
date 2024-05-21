import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";

@Component({
	selector: "app-dialog",
	standalone: true,
	imports: [CommonModule, MatDialogModule, MatButtonModule],
	template: `
        <div class="container">
            @if (dialogData.title) {
                <span mat-dialog-title>{{dialogData.title}}</span>
            }
            <mat-dialog-content>
                @if (dialogData.template) {
                    <ng-container *ngTemplateOutlet="dialogData.template"></ng-container>
                } @else if (dialogData.message) {
                    {{dialogData.message}}
                }
            </mat-dialog-content>
        </div>
    `,
	styles:[`
        .container {
            max-width: 468px;
        }
    `]
})
export class DialogComponent {
	constructor(@Inject(MAT_DIALOG_DATA) public dialogData: any){}
}