import { CommonModule } from "@angular/common";
import {
	Component,
	inject,
	Input,
	TemplateRef,
	ViewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialogRef } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { Store } from "@ngrx/store";
import { at, orderBy } from "lodash-es";
import { filter, switchMap } from "rxjs";

import { DialogButtonType } from "../../models/dialog.model";
import { Group, GroupMember, MemberRole } from "../../models/group.model";
import { DialogService } from "../../services/dialog.service";
import { RouterSelector } from "../../store/app.selector";
import { GroupAction } from "../../store/group/group.action";
import { GroupSelector } from "../../store/group/group.selector";
import { DialogComponent } from "../shared/dialog.component";
import { DividerComponent } from "../shared/divider.component";

import { GroupUserManager } from "./group-user-manager.util";

@Component({
	selector: "app-group-user-manager",
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatButtonModule,
		MatInputModule,
		MatCardModule,
		MatIconModule,
		DividerComponent
	],
	template: `
		<mat-card>
			<mat-card-header>
				<mat-card-subtitle>Members:</mat-card-subtitle>
				<button mat-mini-fab color="primary"
					[hidden]="!userManager.isAdmin(currentUser)"
					(click)="openAddMemberDialog()">
					<mat-icon>person_add</mat-icon>
				</button>
			</mat-card-header>
			<mat-card-content>
				@for (member of members; track $index) {
					<div class="user-info">
						<div class="user-details">
							<span>{{ member.name }}</span>
							@if (userManager.isAdmin(member)) { <span class="role">(admin)</span> }
						</div>
						@if (userManager.isAdmin(currentUser)) {
							<div class="user-actions">
								<button mat-button
										[hidden]="userManager.isCurrentUser(member) || userManager.isVirtualMember(member)"
										(click)="toggelAdmin(member)">
											{{userManager.isAdmin(member) ? "Remove" : "Make"}} admin
								</button>
								<button mat-button color="warn" 
										[disabled]="userManager.isCurrentUser(member)"
										(click)="removeMemberFromGroup(member.id, member.name)">
											<mat-icon>person_remove</mat-icon>
								</button>
							</div>
						}
					</div>

					@if($index !== members.length - 1) {
						<app-divider></app-divider>
					}
				}
			</mat-card-content>
		</mat-card>

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
	`,
	styles: [`
		.mat-mdc-card {
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
				}

				.user-details {
					display: flex;
					align-items: center;

					> span:first-child {
						margin-right: 8px;
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

		.btn-group {
			display: flex;
			flex-direction: column;
			gap: 8px;
			padding: 0 16px 16px 16px;
		}
	`],
})
export class GroupUserManagerComponent {
	private readonly dialog = inject(DialogService);
	private readonly store = inject(Store);

	private addMemberDialogRef: MatDialogRef<DialogComponent, unknown> | undefined;

	@ViewChild("addMemberDialogTemplate")
	private readonly addMemberDialogTemplate: TemplateRef<unknown> | undefined;

	@ViewChild("addUserToGroupDialogTemplate")
	private readonly addUserToGroupDialogTemplate: TemplateRef<unknown> | undefined;

	@ViewChild("addVirtualMemberToGroupDialogTemplate")
	private readonly addVirtualMemberToGroupDialogTemplate: TemplateRef<unknown> | undefined;

	protected virtualMemberName?: string;
	protected userManager = GroupUserManager;
	protected groupCode$ = this.store.select(RouterSelector.selectParams).pipe(
		filter(params => !!params["id"]),
		switchMap(params => this.store.select(GroupSelector.selectCode(params["id"])))
	);

	@Input() group: Group | undefined;

	protected get members(): GroupMember[] {
		return orderBy(at(this.group?.members ?? {}, this.group?.memberIds ?? []), "name");
	}

	protected get currentUser(): GroupMember | undefined {
		return this.userManager.getCurrentUser(this.group?.members);
	}

	protected openAddMemberDialog() {
		this.addMemberDialogRef = this.dialog.open({
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
			if(this.group?.id) {
				this.store.dispatch(GroupAction.getCode({ id: this.group.id }));
				setTimeout(() => {
					addMemberDialogRef.close();
				}, 300000);
			}
		});

		addMemberDialogRef.afterClosed().subscribe(_ => this.addMemberDialogRef?.close());
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
							if(this.virtualMemberName  && this.group?.id) {
								this.store.dispatch(GroupAction.addVirtualMember({ 
									groupId: this.group.id, 
									name: this.virtualMemberName 
								}));
							}
						}
					}
				]
			}
		});

		dialogRef.afterClosed().subscribe(_ => {
			this.virtualMemberName = undefined;
			this.addMemberDialogRef?.close();
		});
	}	

	protected toggelAdmin(member: GroupMember) {
		if(!this.group?.id) {
			return;
		}

		this.store.dispatch(GroupAction.updateRole({
			id: this.group?.id,
			memberId: member.id,
			role: member.role === MemberRole.admin ? MemberRole.user : MemberRole.admin
		}));
	}
	
	protected removeMemberFromGroup(memberId: string, name: string) {
		this.dialog.open({
			data: {
				message: `Are you sure want to remove ${name} from this group?`,
				actionButtons: [
					{
						type: DialogButtonType.Close,
						label: "Cancel"
					},
					{
						type: DialogButtonType.Primary,
						label: "Yes",
						action: () => {
							if(this.group?.id) {
								this.store.dispatch(GroupAction.removeMember({ id: this.group.id, memberId }));
							}
						}
					}
				]
			}
		});
	}
}