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
import { MatRadioModule } from "@angular/material/radio";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { finalize, Subscription } from "rxjs";

import { DialogButtonType, DialogData } from "../../models/dialog.model";
import { groupImages, GroupMember, GroupType } from "../../models/group.model";
import { Otp } from "../../models/otp.model";
import { DialogService } from "../../services/dialog.service";
import { GroupService } from "../../services/group.service";
import { NavigationService } from "../../services/navigation.service";
import { NotificationService } from "../../services/notification.service";
import { ErrorCode } from "../../utilities/error-codes";
import { OtpComponent } from "../otp.component";
import { LayoutComponent } from "../shared/layout.component";

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
		MatRadioModule,
		MatSlideToggleModule,
		OtpComponent
	],
	templateUrl: "./group-editor.component.html",
	styleUrls: ["./group-editor.component.scss"]
})
export class GroupEditorComponent implements OnInit, OnDestroy {
	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);
	private readonly groupService = inject(GroupService);
	private readonly dialog = inject(DialogService);

	private groupSubscription$$: Subscription | undefined;

	protected groupImages = groupImages;
	protected selectedIndex: number | undefined;
	protected members: GroupMember[] | undefined;
	protected currentUser: GroupMember | undefined;
	protected groupName: string | undefined;
	protected oldGroupName: string | undefined;
	protected groupCode: number | undefined;
	protected groupType = GroupType;
	protected selectedGroupType: GroupType = GroupType.ExpenseTracker;
	protected excludeTotal = false;

	@Input() id: string = "";

	@ViewChild("joinGroupDialogTemplate") joinGroupDialogTemplate: TemplateRef<unknown> | undefined;
	@ViewChild("addUserToGroupDialogTemplate") addUserToGroupDialogTemplate: TemplateRef<unknown> | undefined;

	ngOnInit(): void {
		if (this.id) {
			this.groupSubscription$$ = this.groupService.get$(this.id).subscribe(group => {
				this.groupName = this.oldGroupName = group.name;
				this.selectedIndex = groupImages.findIndex(g => g.alt === group.imageUrl);
				this.members = group.members.filter(m => m.active !== false);
				this.currentUser = this.members.find(member => this.isCurrentUser(member));
				this.excludeTotal = group.excludeTotal ?? false;
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
		if (!this.groupName || this.selectedIndex == undefined) {
			return;
		}

		this.notification.showLoading();
		this.groupService.create$({
			name: this.groupName,
			imageUrl: groupImages[this.selectedIndex].alt,
			groupTotal: 0,
			members: [],
			monthTotal: {},
			groupType: this.selectedGroupType,
			excludeTotal: this.excludeTotal,
		}).pipe(
			finalize(() => this.notification.hideLoading())
		).subscribe({
			next: () => this.navigation.navigateToHome(),
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
