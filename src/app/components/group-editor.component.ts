import { CommonModule } from "@angular/common";
import {
	Component,
	inject,
	Input,
	OnDestroy,
	OnInit,
	TemplateRef,
	ViewChild
} from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { finalize, Subscription } from "rxjs";

import { DialogButtonType, DialogData } from "../models/dialog.model";
import { groupImages, GroupMember, GroupType } from "../models/group.model";
import { Otp } from "../models/otp.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { DialogService } from "../services/dialog.service";
import { GroupService } from "../services/group.service";
import { NavigationService } from "../services/navigation.service";
import { NotificationService } from "../services/notification.service";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { ErrorCode } from "../utilities/error-codes";

import { OtpComponent } from "./otp.component";
import { LayoutComponent } from "./shared/layout.component";

@Component({
	selector: "app-group-editor",
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		LayoutComponent,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatDividerModule,
		MatCardModule,
		MatIconModule,
		MatRadioModule,
		MatSlideToggleModule,
		OtpComponent
	],
	template: `
		<app-layout headerHeight="224px" [pageTitle]="id ? 'Settings' : 'Create a group'">
			<div section="header">
				<mat-form-field>
					<mat-label>Group Name</mat-label>
					<input matInput
						[formControl]="form.controls.name"
						[readonly]="id && !isAdmin(currentUser)" />
				</mat-form-field>
				<div class="image-container">
					@for (item of groupImages; track item) {
					<div>
						<img width="48" height="48"
							[class.selected]="selectedIndex === $index"
							[src]="item.src"
							[alt]="item.alt"
							(click)="selectImage($index)" />
						<span>{{item.alt}}</span>
					</div>
					}
				</div>
			</div>

			<div section="detail" class="detail-section">
				<mat-radio-group labelPosition="after" name="groupType"
					[formControl]="form.controls.groupType"
					[hidden]="id">
					<mat-radio-button [value]="groupType.ExpenseTracker">Track Expenses</mat-radio-button>
					<mat-radio-button [value]="groupType.SpiltExpense" disabled>Split Bills</mat-radio-button>
				</mat-radio-group>

				@if (form.controls.groupType.value === groupType.ExpenseTracker &&
						(!id || currentUser?.role === "admin")) {
					<mat-slide-toggle [formControl]="form.controls.excludeTotal">
						&nbsp;&nbsp;exclude from combined total
					</mat-slide-toggle>
				}

				@if (id) {
					<mat-card>
						<mat-card-header>
							<mat-card-subtitle>Members:</mat-card-subtitle>
						</mat-card-header>
						<mat-card-content>
							@for (member of members; track member) {
								<div class="user-info">
									<div class="user-details">
										<span>{{ member.name }}</span>
										@if (isAdmin(member)) { <span class="role">(admin)</span> }
									</div>
									@if (currentUser && isAdmin(currentUser)) {
										<div class="user-actions">
											<button mat-button [hidden]="isCurrentUser(member)" (click)="toggelAdmin(member)">
												{{isAdmin(member) ? "Remove" : "Make"}} admin
											</button>
											<button mat-button color="warn" [disabled]="isCurrentUser(member)"
												(click)="removeMember(member.id)">
												<mat-icon>person_remove</mat-icon>
											</button>
										</div>
									}
								</div>
								<mat-divider></mat-divider>
							}
						</mat-card-content>
					</mat-card>
					
					@if (currentUser?.role === "admin") {
						<button mat-raised-button color="primary" class="rounded-button" (click)="openAddMemberDialog()">
							Invite Member
						</button>
					}

					<button mat-raised-button color="warn" class="rounded-button" (click)="removeMember()">
						Leave Group
					</button>
				}
			</div>
		</app-layout>

		<ng-template #addUserToGroupDialogTemplate>
			<div class="add-user-to-group-template">
				@if (groupCode) {
					<div class="code">{{groupCode}}</div>
					<div class="timer">code is valid only for 5 minutes</div>
					<p>Others can join this group <br />
						using the above code</p>
				} @else {
					Please wait, generating new code...
				}
			</div>
		</ng-template>

		<ng-template #joinGroupDialogTemplate>
			<app-otp-selector></app-otp-selector>
		</ng-template>
	`,
	styles: [`
		.image-container {
			display: flex;
			overflow-x: auto;

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
					transform: scale(1.6);
				}
			}
		}

		.detail-section {
			display: flex;
			flex-direction: column;
			gap: 16px;
			margin: 16px;
			align-items: center;

			> mat-card {
				width: 100%;
				height: 250px;
				border-radius: 24px;

				> mat-card-content {
					display: flex;
					flex-direction: column;

					.user-info {
						display: flex;
						align-items: center;
						justify-content: space-between;
						margin: 8px 0;
					}

					.user-details {
						display: flex;
						align-items: center;

						> span:first-child {
							margin-right: 8px;
						}
					}

					.user-actions {
						display: flex;
						gap: 8px;

						> button {
							min-width: fit-content;
							font-size: 12px;
							font-weight: 100;
						}
					}
				}
			}
		}

		.add-user-to-group-template {
			text-align: center;

			.timer {
				font-size: 0.6rem;
				margin-top: 8px;
			}

			.code {
				font-size: 3rem;
				font-weight: 500;
				letter-spacing: 12px;
			}
		}
	`]
})
export class GroupEditorComponent implements OnInit, OnDestroy {
	@ViewChild("joinGroupDialogTemplate") joinGroupDialogTemplate: TemplateRef<unknown> | undefined;
	@ViewChild("addUserToGroupDialogTemplate") addUserToGroupDialogTemplate: TemplateRef<unknown> | undefined;

	@Input() id: string = "";

	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);
	private readonly groupService = inject(GroupService);
	private readonly dialog = inject(DialogService);
	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly fb = inject(NonNullableFormBuilder);

	private groupSubscription$$: Subscription | undefined;

	protected form = this.fb.group({
		name: ["", [Validators.required]],
		imageUrl: ["", [Validators.required]],
		groupType: [GroupType.ExpenseTracker],
		excludeTotal: [false]
	});
	protected groupImages = groupImages;
	protected selectedIndex: number | undefined;
	protected members: GroupMember[] | undefined;
	protected currentUser: GroupMember | undefined;
	protected groupCode: number | undefined;
	protected groupType = GroupType;

	ngOnInit(): void {
		if (this.id) {
			this.groupSubscription$$ = this.groupService.get$(this.id).subscribe(group => {
				this.form.patchValue({...group});
				this.selectedIndex = groupImages.findIndex(g => g.alt === group.imageUrl);
				this.members = group.members.filter(m => m.active !== false);
				this.currentUser = this.members.find(member => this.isCurrentUser(member));
			});
		}

		this.toolbar.configure({
			back: { visible: true },
			actionBtns: [
				{
					type: ToolbarButtonType.Primary,
					label: "Join",
					visible: () => !this.id,
					action: () => this.openJoinGroupDialog()
				},
				{
					type: ToolbarButtonType.Warn,
					label: "Delete Group",
					visible: () => !!this.id && this.currentUser?.role === "admin",
					action: () => this.deleteGroup()
				},
				{
					type: ToolbarButtonType.Primary,
					label: this.id ? "Update" : "Create",
					disabled: () => !this.form.dirty || !this.form.valid,
					action: () => this.id ? this.update() : this.create()
				}
			]
		});
	}

	ngOnDestroy(): void {
		this.groupSubscription$$?.unsubscribe();
	}

	isAdmin(member: GroupMember | undefined) {
		return member && member.role === "admin";
	}

	isCurrentUser(member: GroupMember | undefined) {
		return member && member.name === "You";
	}

	selectImage(index: number) {
		this.selectedIndex = index;
		this.form.controls.imageUrl.setValue(groupImages[index].alt);
		this.form.markAsDirty();
	}

	openAddMemberDialog() {
		const addMemberDialogRef = this.dialog.open({
			data: {
				template: this.addUserToGroupDialogTemplate,
				actionButtons: [
					{
						type: DialogButtonType.Close,
						label: "Close"
					}
				]
			}
		});

		addMemberDialogRef.afterOpened().subscribe(async _ => {
			this.notification.showLoading();
			try {
				this.groupCode = await this.groupService.getCode(this.id);
			} catch (err) {
				this.notification.firebaseError(err);
			} finally {
				this.notification.hideLoading();
			}

			setTimeout(() => {
				addMemberDialogRef.close();
			}, 300000);
		});
	}

	openJoinGroupDialog() {
		this.dialog.open<DialogData<Otp>>({
			data: {
				template: this.joinGroupDialogTemplate,
				actionButtons: [
					{
						type: DialogButtonType.Close,
						label: "Close"
					},
					{
						type: DialogButtonType.Primary,
						label: "Join",
						disabled: data => data?.code1 == null || data.code2 == null || data.code3 == null || data.code4 == null,
						action: (data) => {
							const code = +`${data?.code1}${data?.code2}${data?.code3}${data?.code4}`;
							this.notification.showLoading();
							this.groupService.addMemeberToGroup$(code).pipe(
								finalize(() => this.notification.hideLoading())
							).subscribe({
								next: () => this.navigation.navigateToHome(),
								error: (error) => this.notification.error(error)
							});
						}
					}
				]
			}
		});
	}

	create() {
		const { name, imageUrl, groupType, excludeTotal } = this.form.value;
		if(!name || !imageUrl) {
			return;
		}
		this.notification.showLoading();
		this.groupService.create$({ name, imageUrl, groupType, excludeTotal }).pipe(
			finalize(() => this.notification.hideLoading())
		).subscribe({
			next: () => this.navigation.navigateToHome(),
			error: (error) => this.notification.firebaseError(error)
		});
	}

	update() {
		const { name, imageUrl, groupType, excludeTotal } = this.form.value;
		if(!name || !imageUrl) {
			return;
		}
		this.notification.showLoading();
		this.groupService.update$(this.id, { name, imageUrl, groupType, excludeTotal }).pipe(
			finalize(() => this.notification.hideLoading())
		).subscribe({
			error: (error) => this.notification.firebaseError(error)
		});
	}

	toggelAdmin(member: GroupMember) {
		this.notification.showLoading();
		this.groupService.updateRole$(this.id, member.id, member.role === "admin" ? "user" : "admin").pipe(
			finalize(() => this.notification.hideLoading())
		).subscribe({
			error: (error) => this.notification.firebaseError(error)
		});
	}

	removeMember(memberId?: string) {
		this.notification.showLoading();
		this.groupService.removeMember$(this.id, memberId).pipe(
			finalize(() => this.notification.hideLoading())
		).subscribe({
			next: () => {
				if (!memberId) {
					this.navigation.navigateToHome();
				}
			},
			error: err => {
				if (err.message === ErrorCode.NO_OTHER_ADMIN_FOUND) {
					this.notification.error("Cannot leave, you are the only admin here.");
				}
			}
		});
	}

	deleteGroup() {
		this.dialog.open({
			data: {
				message: "Are you sure want to delete this group?",
				actionButtons: [
					{
						type: DialogButtonType.Close,
						label: "Cancel"
					},
					{
						type: DialogButtonType.Primary,
						label: "Yes",
						action: () => {
							this.notification.showLoading();
							this.groupService.delete$(this.id).pipe(
								finalize(() => this.notification.hideLoading())
							).subscribe({
								next: () => this.navigation.navigateToHome(),
								error: (error) => this.notification.firebaseError(error)
							});
						}
					}
				]
			}
		});
	}
}
