import { Component, effect, OnInit } from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioChange, MatRadioModule } from "@angular/material/radio";

import { ToolbarButtonType } from "../models/toolbar.model";
import { avatars } from "../models/user.model";
import { AuthService } from "../services/auth.service";
import { NavigationService } from "../services/navigation.service";
import { NotificationService } from "../services/notification.service";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { UserService } from "../services/user.service";
import { getFirebaseErrorMessage } from "../utilities/firebase-errors";

import { LayoutComponent } from "./shared/layout.component";

@Component({
	selector: "app-profile-editor",
	standalone: true,
	imports: [
		LayoutComponent,
		MatInputModule,
		MatFormFieldModule,
		MatRadioModule,
		ReactiveFormsModule,
	],
	template: `
		<app-layout headerHeight="320px" pageTitle="Profile">
			<div section="header">
				<form [formGroup]="form">
					<mat-form-field>
						<mat-label>Name</mat-label>
						<input matInput [formControl]="form.controls.name"/>
					</mat-form-field>
					<mat-form-field>
						<input matInput [formControl]="form.controls.email" readonly />
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
			<div section="detail" class="detail-section">
				<div>
					<span>Theme</span>
					<mat-radio-group
						name="themeSelector"
						color="warn"
						[value]="userService.currentUser()?.preferences?.theme ?? 'light'"
						(change)="onThemeChange($event)" >
							<mat-radio-button value="light">Light</mat-radio-button>
							<mat-radio-button value="dark">Dark</mat-radio-button>
					</mat-radio-group>
				</div>
			</div>
		</app-layout>
	`,
	styles: [`
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
				transform: scale(1.5);
			}
		}

		.detail-section {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 16px;
			padding: 16px;
		}
	`]
})
export class ProfileEditorComponent implements OnInit {
	protected form = this.fb.group({
		uid: "",
		name: ["", [Validators.required]],
		email: "",
		photoUrl: "",
	});
	protected avatars = avatars;
	protected selectedIndex: number | undefined;

	constructor(
		private notification: NotificationService,
		private fb: NonNullableFormBuilder,
		private navigation: NavigationService,
		private toolbar: ToolbarConfigurationService,
		private authService: AuthService,
		protected userService: UserService,
	) {
		effect(() => {
			this.form.patchValue({ ...userService.currentUser() });
			this.selectedIndex = avatars.findIndex(
				avatar => avatar.alt === userService.currentUser()?.photoUrl
			);
		});
	}

	ngOnInit(): void {
		this.toolbar.configure({
			back: { visible: true },
			actionBtns: [
				{
					type: ToolbarButtonType.Warn,
					label: "Logout",
					action: async () => {
						await this.authService.logout();
						this.navigation.navigateToHome();
					}
				},
				{
					type: ToolbarButtonType.Primary,
					label: "Update",
					disabled: () => !this.form.dirty || !(this.selectedIndex === 0 ? 1 : this.selectedIndex),
					action: () => this.update()
				}
			]
		});
	}

	selectImage(index: number) {
		this.selectedIndex = index;
		this.form.controls.photoUrl.setValue(this.avatars[index].alt);
		this.form.markAsDirty();
	}

	async onThemeChange($event: MatRadioChange) {
		const user = this.userService.currentUser();
		if (user) {
			const { uid, ...data } = user;
			data.preferences = {
				theme: $event.value
			};

			try {
				await this.userService.updateUser({ uid, ...data });
			} catch (err) {
				this.notification.error(getFirebaseErrorMessage(err));
			}
		}
	}

	async update() {
		const { uid, ...data } = this.form.value;

		if (!uid) {
			return;
		}

		try {
			this.notification.showLoading();
			await this.userService.updateUser({ uid, ...data });
			this.navigation.navigateBack();
		} catch (err) {
			this.notification.error(getFirebaseErrorMessage(err));
		} finally {
			this.notification.hideLoading();
		}
	}
}