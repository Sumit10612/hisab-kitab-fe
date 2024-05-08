import { Component, inject } from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Router } from "@angular/router";

import { groupImages } from "../models/group.model";
import { GroupService } from "../services/group.service";
import { NotificationService } from "../services/notification.service";
import { UserService } from "../services/user.service";
import { getFirebaseErrorMessage } from "../utilities/firebase-errors";

import { PageNavHeaderComponent } from "./shared/page-nav-header.component";
import { LayoutComponent } from "./shared/layout.component";

@Component({
	selector: "app-create-group",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		PageNavHeaderComponent,
    LayoutComponent
	],
	template: `
    <app-layout>
      <div section="header">
        <app-page-nav-header backRoute="/home" title="Create a group"></app-page-nav-header>

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
	private readonly router = inject(Router);
	private readonly notification = inject(NotificationService);
	private readonly groupService = inject(GroupService);
	private readonly usersService = inject(UserService);
  
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

		try {
			this.notification.showLoading();
			const groupId = await this.groupService.createGroup({
				name, 
				imageUrl: this.groupImages[this.selectedIndex].alt
			});

			const currentUser = this.usersService.currentUser();
			if(currentUser) {
				await this.usersService.updateUser({
					...currentUser,
					groups: [
						...currentUser.groups ?? [],
						groupId
					]
				});
			}

			this.router.navigate(["home"]);
		} catch (error) {
			this.notification.error(getFirebaseErrorMessage(error));
		} finally {
			this.notification.hideLoading();
		}
	}
}
