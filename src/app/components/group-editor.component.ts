import {
	Component,
	inject,
	Input,
	OnDestroy,
	OnInit,
	TemplateRef,
	ViewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { finalize, Subscription } from "rxjs";

import { DialogButtonType, DialogData } from "../models/dialog.model";
import { groupImages, GroupMember } from "../models/group.model";
import { Otp } from "../models/otp.model";
import { DialogService } from "../services/dialog.service";
import { GroupCodeService } from "../services/group-code.service";
import { GroupService } from "../services/group.service";
import { NavigationService } from "../services/navigation.service";
import { NotificationService } from "../services/notification.service";
import { ErrorCode } from "../utilities/error-codes";

import { OtpComponent } from "./otp.component";
import { LayoutComponent } from "./shared/layout.component";

@Component({
	selector: "app-group-editor",
	standalone: true,
	imports: [
		FormsModule,
		LayoutComponent,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatDividerModule,
		MatCardModule,
		MatIconModule,
		OtpComponent
	],
	template: `
	<app-layout [showNav]="true" [pageTitle]="id ? 'Settings' : 'Create a group'">
		<div section="header" class="header-section">
			<mat-form-field>
				<mat-label>Group Name</mat-label>
				<input matInput [(ngModel)]="groupName" [readonly]="id && currentUser?.role !== 'admin'" />
			</mat-form-field>
			@if (id) {
				@if (currentUser?.role === "admin") {
					<div class="btn-group">
						<button mat-raised-button
							(click)="update()"
							class="rounded-button"
							color="primary"
							[disabled]="!groupName || oldGroupName === groupName">
								Update Group Name
						</button>
						
						<button mat-raised-button
							color="primary"
							class="rounded-button"
							(click)="openAddMemberDialog()">
							Invite Member
						</button>
					</div>
				}
			} @else {
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
			}
		</div>

		<div section="detail" class="detail-section">
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
										<button
											mat-button
											[hidden]="isCurrentUser(member)"
											(click)="toggelAdmin(member)">
												{{isAdmin(member) ? "Remove" : "Make"}} admin
										</button>
										<button mat-button color="warn" [disabled]="isCurrentUser(member)" (click)="removeMember(member.id)">
											<mat-icon>person_remove</mat-icon>
										</button>
									</div>
								}
							</div>
							<mat-divider></mat-divider>
						}
					</mat-card-content>
				</mat-card>

				<button
					mat-raised-button
					color="warn"
					class="rounded-button"
					(click)="removeMember()">
						Leave Group
				</button>
			} @else {
				<button 
					(click)="create()"
					mat-raised-button
					class="rounded-button"
					color="primary"
					[disabled]="!groupName || !(selectedIndex === 0 ? 1 : selectedIndex)">
						Create Group
				</button>
				<span>-- OR --</span>
				<button (click)="openJoinGroupDialog()"
					mat-raised-button
					class="rounded-button"
					color="primary">
						Join Group
				</button>
			}

			@if (id && currentUser?.role === "admin") {
				<button 
					mat-raised-button
					class="rounded-button"
					color="warn"
					(click)="deleteGroup()">
						Delete Group
				</button>
			}
		</div>
	</app-layout>

	<ng-template #addUserToGroupDialogTemplate>
		<div class="add-user-to-group-template">
			@if (groupCode) {
				<div class="code">{{groupCode}}</div>
				<div class="timer">code is valid only for 5 minutes</div>
				<p>Others can join this group <br/>
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
	.header-section {
		margin: 16px;
		display: flex;
		flex-direction: column;

		.image-container {
		display: flex;
		overflow-x: auto;
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

	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin: 16px;
		align-items: center;

		> mat-card {
			width: 100%;
			height: 250px;

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

	.btn-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
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
	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);
	private readonly groupService = inject(GroupService);
	private readonly dialog = inject(DialogService);
	private readonly groupCodeService = inject(GroupCodeService);

	private groupSubscription$$: Subscription | undefined;

	protected groupImages = groupImages;
	protected selectedIndex: number | undefined;
	protected members: GroupMember[] | undefined;
	protected currentUser: GroupMember | undefined;
	protected groupName: string | undefined;
	protected oldGroupName: string | undefined;
	protected groupCode: number | undefined;

	@Input() id: string = "";

	@ViewChild("joinGroupDialogTemplate") joinGroupDialogTemplate: TemplateRef<unknown> | undefined;
	@ViewChild("addUserToGroupDialogTemplate") addUserToGroupDialogTemplate: TemplateRef<unknown> | undefined;

	ngOnInit(): void {
		if (this.id) {
			this.groupSubscription$$ = this.groupService.get$(this.id).subscribe(group => {
				this.groupName = this.oldGroupName = group.name;
				this.selectedIndex = groupImages.findIndex(g => g.alt === group.imageUrl);
				this.members = group.members;
				this.currentUser = this.members.find(member => this.isCurrentUser(member));
			});
		}
	}

	ngOnDestroy(): void {
		this.groupSubscription$$?.unsubscribe();
	}

	isAdmin(member: GroupMember) {
		return member.role === "admin";
	}

	isCurrentUser(member: GroupMember) {
		return member.name === "You";
	}

	selectImage(index: number) {
		this.selectedIndex = index;
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
				this.groupCode = await this.groupCodeService.getCode(this.id);
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
							this.groupCodeService.addMemeberToGroup$(code).pipe(
								finalize(() => this.notification.hideLoading())
							).subscribe({
								next: () => this.navigation.navigateTo(["/home"]),
								error: (error) => this.notification.error(error)
							});
						}
					}
				]
			}
		});
	}

	create() {
		if (!this.groupName || this.selectedIndex == undefined) {
			return;
		}

		this.notification.showLoading();
		this.groupService.create$({
			name: this.groupName,
			imageUrl: groupImages[this.selectedIndex].alt,
			groupTotal: 0,
			members: [],
			monthTotal: {}
		}).pipe(
			finalize(() => this.notification.hideLoading())
		).subscribe({
			next: (id) => this.navigation.navigateTo(["/group-detail", id]),
			error: (error) => this.notification.firebaseError(error)
		});
	}

	update() {
		if (!this.groupName) {
			return;
		}

		this.notification.showLoading();
		this.groupService.update$(this.id, this.groupName).pipe(
			finalize(() => this.notification.hideLoading())
		).subscribe({
			error: (error) => this.notification.firebaseError(error)
		}); this.notification.hideLoading();
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
					this.navigation.navigateTo(["/home"]);
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
								next: () => this.navigation.navigateTo(["/home"]),
								error: (error) => this.notification.firebaseError(error)
							});
						}
					}
				]
			}
		});
	}
}
