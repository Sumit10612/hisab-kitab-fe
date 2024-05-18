import { Component, inject } from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

import { groupImages } from "../models/group.model";
import { GroupService } from "../services/group.service";
import { NotificationService } from "../services/notification.service";

import { LayoutComponent } from "./shared/layout.component";
import { finalize } from "rxjs";
import { NavigationService } from "../services/navigation.service";

@Component({
	selector: "app-create-group",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		LayoutComponent
	],
	template: `
    <app-layout [showNav]="true" pageTitle="Create a group">
      <div section="header">
        <div class="create-group-section">
          <form [formGroup]="form" (ngSubmit)="create()">
            <mat-form-field>
              <mat-label>Group Name</mat-label>
              <input matInput [formControl]="form.controls.name" />
            </mat-form-field>

            <div class="image-container">
              @for (item of groupImages; track item) {
                <div>
                  <img
                    width="48"
                    height="48"
                    [class.selected]="selectedIndex === $index"
                    [src]="item.src"
                    [alt]="item.alt"
                    (click)="selectImage($index)" />
                  <span>{{item.alt}}</span>
                </div>      
              }
            </div>
          </form>
        </div>
      </div>
      <div section="detail" class="center margin-top">
        <button 
          (click)="create()"
          mat-raised-button 
          color="primary"
          [disabled]="!form.dirty || !(selectedIndex === 0 ? 1 : selectedIndex)">
          Create
        </button>
      </div>
    </app-layout>    
  `,
	styles: [`
    .create-group-section {
      margin: 16px;

      .image-container {
        display: flex;
        overflow-x: auto;
        margin-bottom: 24px;
        white-space: nowrap;

        > div {
          display: flex;
          flex-direction: column;
          align-items: center;

          > img {
            margin: 8px 8px 0 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          > span {
            margin-bottom: 8px;
          }

          .selected {
            transform: scale(1.4);
          }
        }        
      }
    }
  `]
})
export class CreateGroupComponent {
	private readonly notification = inject(NotificationService);
  private readonly navigation = inject(NavigationService);
	private readonly groupService = inject(GroupService);
  
	protected readonly formBuilder = inject(NonNullableFormBuilder);

	protected  groupImages = groupImages;
	protected selectedIndex: number | undefined;
	protected form = this.formBuilder.group({
		name: ["", [Validators.required]],
	});

	selectImage(index: number) {
		this.selectedIndex = index;
		this.form.markAsDirty();
	}

	async create() {
		const { name } = this.form.value;
		if(!name || this.selectedIndex == undefined) {
			return;
		}

    this.groupService.create$({
      name,
      imageUrl: groupImages[this.selectedIndex].alt,
      groupTotal: 0,
      members: [],
      monthTotal: {}
    }).pipe(
      finalize(() => this.notification.hideLoading())
    ).subscribe({
      next: (id) => this.navigation.navigateTo(["/group", id]), 
      error: (error) => this.notification.firebaseError(error) 
    });
	}
}
