import { CommonModule } from "@angular/common";
import {
	Component,
	EventEmitter,
	inject,
	Input,
	Output,
	TemplateRef,
	ViewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialogRef } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { at, orderBy } from "lodash-es";

import { DialogButtonType } from "../../models/dialog.model";
import { Group, GroupMember, MemberRole } from "../../models/group.model";
import { DialogService } from "../../services/dialog.service";
import { DialogComponent } from "../shared/dialog.component";

@Component({
	selector: "app-group-user",
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatButtonModule,
		MatInputModule,
		MatDividerModule,
		MatCardModule,
		MatIconModule,
	],
	template: `
		<mat-card *ngIf="_group">
			<mat-card-header>
				<mat-card-subtitle>Members:</mat-card-subtitle>
				<button mat-mini-fab color="primary"
					[hidden]="!currentUser || !isAdmin(currentUser)"
					(click)="openAddMemberDialog()">
					<mat-icon>person_add</mat-icon>
				</button>
			</mat-card-header>
			<mat-card-content>
				@for (member of members; track $index) {
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
									(click)="removeMemberFromGroup(member.id, member.name)">
									<mat-icon>person_remove</mat-icon>
								</button>
							</div>
						}
					</div>

					@if($index !== members.length - 1) {
						<mat-divider></mat-divider>
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
				<ng-container *ngIf="groupCode; else loading">
					<div class="code">{{groupCode}}</div>
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
					margin: 4px 0;
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
export class GroupUserComponent {
	private readonly dialog = inject(DialogService);

	private addMemberDialogRef: MatDialogRef<DialogComponent, unknown> | undefined;
	
	protected _group: Group | null | undefined;
	protected currentUser: GroupMember | undefined;
	protected members: GroupMember[] = [];
	protected virtualMemberName?: string;

	@ViewChild("addMemberDialogTemplate")
	private readonly addMemberDialogTemplate: TemplateRef<unknown> | undefined;

	@ViewChild("addUserToGroupDialogTemplate")
	private readonly addUserToGroupDialogTemplate: TemplateRef<unknown> | undefined;

	@ViewChild("addVirtualMemberToGroupDialogTemplate")
	private readonly addVirtualMemberToGroupDialogTemplate: TemplateRef<unknown> | undefined;

	@Input() set group(value: Group | null | undefined) {
		this._group = value;
		if(this._group?.members) {
			this.members = orderBy(at(this._group.members, this._group.memberIds), "name");
		}

		this.currentUser = Object.values(value?.members ?? {})
			.find(member => this.isCurrentUser(member));
	}

	@Input() groupCode: number | null | undefined;

	@Output() updateRole = new EventEmitter<GroupMember>();
	@Output() removeMember = new EventEmitter<string>();
	@Output() addVirutalMember = new EventEmitter<string>();
	@Output() getGroupCode = new EventEmitter<void>();

	protected isAdmin(member: GroupMember | undefined) {
		return member && member.role === MemberRole.admin;
	}

	protected isCurrentUser(member: GroupMember | undefined) {
		return member && member.name === "You";
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
			this.getGroupCode.emit();
			setTimeout(() => {
				addMemberDialogRef.close();
			}, 300000);
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
							if(this.virtualMemberName) {
								this.addVirutalMember.emit(this.virtualMemberName);
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
		this.updateRole.emit(member);
	}
	
	protected removeMemberFromGroup(memberId: string, name?: string) {
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
						action: () => this.removeMember.emit(memberId)
					}
				]
			}
		});
	}
}