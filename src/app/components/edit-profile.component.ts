import { Component, effect, inject } from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Router } from "@angular/router";

import { avatars } from "../models/user.model";
import { NotificationService } from "../services/notification.service";
import { UserService } from "../services/user.service";
import { getFirebaseErrorMessage } from "../utilities/firebase-errors";

import { LayoutComponent } from "./shared/layout.component";
import { PageNavHeaderComponent } from "./shared/page-nav-header.component";

@Component({
	selector: "app-edit-profile",
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
        <app-page-nav-header backRoute="/profile" title="Edit Profile"></app-page-nav-header>

        <div class="edit-profile-section">
          <form [formGroup]="form">
            <mat-form-field>
              <mat-label>Name</mat-label>
              <input matInput [formControl]="form.controls.name" />
            </mat-form-field>

            <div class="image-container">
              @for (item of avatars; track item) {
                <img
                  width="50"
                  height="50"
                  [class.selected]="selectedIndex === $index"
                  [src]="item.src"
                  [alt]="item.alt"
                  (click)="selectImage($index)" />
              }
            </div>        
          </form>
        </div>
      </div>
      <div section="detail" class="text-center margin-top">
        <button 
          (click)="update()"
          mat-raised-button 
          color="primary"
          [disabled]="!form.dirty || !(selectedIndex === 0 ? 1 : selectedIndex)">
          Update
        </button>
      </div>
    </app-layout>
  `,
	styles: [`
    .edit-profile-section {
      margin: 16px;

      .image-container {
        display: flex;
        overflow-x: auto;
        margin-bottom: 16px;
        white-space: nowrap;

        > img {
          margin: 16px 0 16px 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .selected {
          transform: scale(1.4);
        }
      }
    }
  `]
})
export class EditProfileComponent {
	private readonly userService = inject(UserService);
	private readonly notificationService = inject(NotificationService);
	private readonly router = inject(Router);  
	protected readonly formBuilder = inject(NonNullableFormBuilder);

	protected avatars = avatars;

	protected selectedIndex: number | undefined;
	protected form = this.formBuilder.group({
		uid: [""],
		name: [""],
		photoUrl: [""],
	});

	constructor() {
		effect(() => {
			this.form.patchValue({ ...this.userService.currentUser() });
		});
	}

	selectImage(index: number) {
		this.selectedIndex = index;
		this.form.controls.photoUrl.setValue(this.avatars[index].alt);
		this.form.markAsDirty();
	}

	async update() {
		const { uid, ...data } = this.form.value;

		if(!uid) {
			return;
		}

		try {
			this.notificationService.showLoading();
			await this.userService.updateUser({ uid, ...data });

			this.router.navigate(["/profile"]);
		} catch (err) {
			this.notificationService.error(getFirebaseErrorMessage(err));
		} finally {
			this.notificationService.hideLoading();
		}
	}
}
