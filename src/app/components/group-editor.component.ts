import { CommonModule } from "@angular/common";
import {
	Component,
	inject,
	OnInit,
	TemplateRef,
	ViewChild
} from "@angular/core";
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { Store } from "@ngrx/store";
import { filter, map, switchMap, tap } from "rxjs";

import { DialogButtonType, DialogData } from "../models/dialog.model";
import {
	groupImages,
	GroupMember,
	GroupType,
	MemberRole,
	UpsertGroup
} from "../models/group.model";
import { Otp } from "../models/otp.model";
import { ToolbarButtonType } from "../models/toolbar.model";
import { DialogService } from "../services/dialog.service";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { RouterSelector } from "../store/app.selector";
import { GroupAction } from "../store/group/group.action";
import { GroupSelector } from "../store/group/group.selector";

import { OtpComponent } from "./otp.component";
import { LayoutComponent } from "./shared/layout.component";

@Component({
	selector: "app-group-editor",
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
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
		OtpComponent,
	],
	template: `
		<app-layout headerHeight="224px" [pageTitle]="isEdit ? 'Settings' : 'Create a group'">
			<div section="header">
				<mat-form-field>
					<mat-label>Group Name</mat-label>
					<input matInput
						[formControl]="form.controls.name"
						[readonly]="isEdit && !isAdmin(currentUser)" />
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
					[hidden]="isEdit">
					<mat-radio-button [value]="groupType.ExpenseTracker">Track Expenses</mat-radio-button>
					<mat-radio-button [value]="groupType.SpiltExpense">Split Bills</mat-radio-button>
				</mat-radio-group>

				@if (form.controls.groupType.value === groupType.ExpenseTracker &&
						(!isEdit || currentUser?.role === "admin")) {
					<mat-slide-toggle [formControl]="form.controls.excludeTotal">
						&nbsp;&nbsp;exclude from combined total
					</mat-slide-toggle>
				}

				<mat-card *ngIf="group$ | async as group">
					<mat-card-header>
						<mat-card-subtitle>Members:</mat-card-subtitle>
						<button mat-mini-fab color="primary"
							[hidden]="!currentUser || !isAdmin(currentUser)"
							(click)="openAddMemberDialog()">
							<mat-icon>person_add</mat-icon>
						</button>
					</mat-card-header>
					<mat-card-content>
						@for (member of group.members; track member) {
							<div class="user-info">
								<div class="user-details">
									<span>{{ member.name }}</span>
									@if (isAdmin(member)) { <span class="role">(admin)</span> }
								</div>
								@if (currentUser && isAdmin(currentUser)) {
									<div class="user-actions">
										<button mat-button [hidden]="isCurrentUser(member) || member.isVirtual" (click)="toggelAdmin(member)">
											{{isAdmin(member) ? "Remove" : "Make"}} admin
										</button>
										<button mat-button color="warn" [disabled]="isCurrentUser(member)"
											(click)="removeMember(member.id, member.name)">
											<mat-icon>person_remove</mat-icon>
										</button>
									</div>
								}
							</div>
							<mat-divider></mat-divider>
						}
					</mat-card-content>
				</mat-card>
			</div>
		</app-layout>

		<ng-template #addMemberDialogTemplate>
			<div class="btn-group">
				<button mat-raised-button color="primary" (click)="openInviteMemberDialog()">
					Invite Member
				</button>
				<button mat-raised-button color="primary" (click)="openAddVirtualMemberDialog()">
					Add Virtual Member
				</button>
			</div>
		</ng-template>

		<ng-template #addUserToGroupDialogTemplate>
			<div class="add-user-to-group-template">
				<ng-container *ngIf="groupCode$ | async as code; else loading">
					<div class="code">{{code}}</div>
					<div class="timer">code is valid only for 5 minutes</div>
					<p>Others can join this group <br />
						using the above code</p>
				</ng-container>
				<ng-template #loading>
					Please wait, generating new code...
				</ng-template>
			</div>
		</ng-template>

		<ng-template #addVirtualMemberToGroupDialogTemplate>
			<mat-form-field>
				<mat-label>Name</mat-label>
				<input matInput [(ngModel)]="virtualMemberName" />
			</mat-form-field>
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
				max-height: 300px;
				border-radius: 24px;

				> mat-card-header {
					display: flex;
					align-items: center;
					justify-content: space-between;
				}

				> mat-card-content {
					display: flex;
					flex-direction: column;
					overflow-y: auto;

					.user-info {
						display: flex;
						align-items: center;
						justify-content: space-between;
						margin: 4px 0;
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

		.btn-group {
			display: flex;
			flex-direction: column;
			gap: 16px;
			padding: 0 16px 16px 16px;
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
export class GroupEditorComponent implements OnInit {
	@ViewChild("addMemberDialogTemplate") addMemberDialogTemplate: TemplateRef<unknown> | undefined;
	@ViewChild("joinGroupDialogTemplate") joinGroupDialogTemplate: TemplateRef<unknown> | undefined;
	@ViewChild("addUserToGroupDialogTemplate") addUserToGroupDialogTemplate: TemplateRef<unknown> | undefined;
	@ViewChild("addVirtualMemberToGroupDialogTemplate") addVirtualMemberToGroupDialogTemplate: TemplateRef<unknown> | undefined;

	private readonly dialog = inject(DialogService);
	private readonly toolbar = inject(ToolbarConfigurationService);
	private readonly fb = inject(NonNullableFormBuilder);
	private readonly store = inject(Store);

	protected isEdit = false;
	protected form = this.fb.group({
		id: "",
		name: ["", [Validators.required]],
		imageUrl: ["", [Validators.required]],
		groupType: [GroupType.ExpenseTracker],
		excludeTotal: [false]
	});
	protected groupImages = groupImages;
	protected selectedIndex: number | undefined;
	protected members: GroupMember[] | undefined;
	protected currentUser: GroupMember | undefined;
	protected groupType = GroupType;
	protected virtualMemberName?: string;

	protected group$ = this.store.select(RouterSelector.selectParams).pipe(
		filter(params => !!params["id"]),
		switchMap(params => this.store.select(GroupSelector.selectGroup(params["id"])).pipe(
			tap(group => {
				this.isEdit = true;
				this.form.patchValue({ ...group });
				this.selectedIndex = groupImages.findIndex(g => g.alt === group?.imageUrl);
				this.currentUser = Object.values(group?.members ?? {}).find(member => this.isCurrentUser(member));
			}),
			map(group => {
				const members = group?.memberIds.map(id => group.members[id]);
				return {
					...group,
					members
				};
			})
		))
	);

	protected groupCode$ = this.store.select(RouterSelector.selectParams).pipe(
		filter(params => !!params["id"]),
		switchMap(params => this.store.select(GroupSelector.selectCode(params["id"])))
	);

	ngOnInit(): void {
		this.toolbar.configure({
			back: { visible: () => true },
			actionBtns: [
				{
					type: ToolbarButtonType.Primary,
					label: "Join",
					visible: () => !this.isEdit,
					action: () => this.openJoinGroupDialog()
				},
				{
					type: ToolbarButtonType.Warn,
					label: "Leave",
					visible: () => this.isEdit,
					action: () => this.removeMember()
				},
				{
					type: ToolbarButtonType.Warn,
					label: "Delete",
					visible: () => this.isEdit && this.currentUser?.role === "admin",
					action: () => this.deleteGroup()
				},
				{
					type: ToolbarButtonType.Primary,
					label: "Update",
					disabled: () => !this.form.dirty || !this.form.valid,
					visible: () => this.isEdit && this.currentUser?.role === "admin",
					action: () => {
						if (this.upsertGroup) {
							this.store.dispatch(GroupAction.update({
								id: this.form.controls.id.value,
								upsertGroup: this.upsertGroup
							}));
							this.form.markAsPristine();
						}
					}
				},
				{
					type: ToolbarButtonType.Primary,
					label: "Create",
					disabled: () => !this.form.dirty || !this.form.valid,
					visible: () => !this.isEdit,
					action: () => {
						if (this.upsertGroup) {
							this.store.dispatch(GroupAction.create({ upsertGroup: this.upsertGroup }));
						}
					}
				}
			]
		});
	}

	get upsertGroup(): UpsertGroup | undefined {
		const { name, imageUrl, groupType, excludeTotal } = this.form.value;
		if (!name || !imageUrl) {
			return;
		}

		return { name, imageUrl, groupType, excludeTotal };
	}

	protected isAdmin(member: GroupMember | undefined) {
		return member && member.role === "admin";
	}

	protected isCurrentUser(member: GroupMember | undefined) {
		return member && member.name === "You";
	}

	protected selectImage(index: number) {
		this.selectedIndex = index;
		this.form.controls.imageUrl.setValue(groupImages[index].alt);
		this.form.markAsDirty();
	}

	protected openAddMemberDialog() {
		this.dialog.open({
			data: {
				template: this.addMemberDialogTemplate
			}
		});
	}

	protected openInviteMemberDialog() {
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
			this.store.dispatch(GroupAction.getCode({ id: this.form.controls.id.value }));
			setTimeout(() => {
				addMemberDialogRef.close();
			}, 300000);
		});
	}

	protected openAddVirtualMemberDialog() {
		const dialogRef = this.dialog.open({
			data: {
				template: this.addVirtualMemberToGroupDialogTemplate,
				actionButtons: [
					{
						type: DialogButtonType.Close,
						label: "Close"
					},
					{
						type: DialogButtonType.Primary,
						label: "Add",
						disabled: () => !this.virtualMemberName,
						action: () => {
							const groupId = this.form.controls.id.value;
							if(groupId && this.virtualMemberName) {
								this.store.dispatch(GroupAction.addVirtualMember({ groupId, name: this.virtualMemberName }));
							}
						}
					}
				]
			}
		});

		dialogRef.afterClosed().subscribe(_ => this.virtualMemberName = undefined);
	}

	protected openJoinGroupDialog() {
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
							this.store.dispatch(GroupAction.addMember({ code }));
						}
					}
				]
			}
		});
	}

	protected create() {
		const { name, imageUrl, groupType, excludeTotal } = this.form.value;
		if (!name || !imageUrl) {
			return;
		}

		this.store.dispatch(GroupAction.create({ upsertGroup: { name, imageUrl, groupType, excludeTotal } }));
	}

	protected toggelAdmin(member: GroupMember) {
		this.store.dispatch(GroupAction.updateRole({
			id: this.form.controls.id.value,
			memberId: member.id,
			role: member.role === MemberRole.admin ? MemberRole.user : MemberRole.admin
		}));
	}

	protected removeMember(memberId?: string, name?: string) {
		this.dialog.open({
			data: {
				message: memberId ? `Are you sure want to remove ${name} from this group?` : "Are you sure want to leave this group?",
				actionButtons: [
					{
						type: DialogButtonType.Close,
						label: "Cancel"
					},
					{
						type: DialogButtonType.Primary,
						label: "Yes",
						action: () => this.store.dispatch(GroupAction.removeMember({ id: this.form.controls.id.value, memberId }))
					}
				]
			}
		});
	}

	protected deleteGroup() {
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
						action: () => this.store.dispatch(GroupAction.deleteGroup({ id: this.form.controls.id.value }))
					}
				]
			}
		});
	}
}
