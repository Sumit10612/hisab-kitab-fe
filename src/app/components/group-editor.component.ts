import { CommonModule } from "@angular/common";
import {
	Component,
	inject,
	OnInit,
	TemplateRef,
	ViewChild
} from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { Store } from "@ngrx/store";
import { filter, switchMap, tap } from "rxjs";

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
import { GroupUserComponent } from "./widgets/group-user.component";

@Component({
	selector: "app-group-editor",
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		LayoutComponent,
		MatButtonModule,
		MatInputModule,
		MatRadioModule,
		MatSlideToggleModule,
		OtpComponent,
		GroupUserComponent
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

				<app-group-user class="group-user"
					(addVirutalMember)="addVirutalMember($event)"
					(getGroupCode)="getGroupCode()"
					(removeMember)="removeMember($event)"
					[groupCode]="groupCode$ | async"
					[group]="group$ | async">
				</app-group-user>
			</div>
		</app-layout>

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

			.group-user {
				width: 100%;
			}
		}
	`]
})
export class GroupEditorComponent implements OnInit {
	@ViewChild("joinGroupDialogTemplate") joinGroupDialogTemplate: TemplateRef<unknown> | undefined;

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
	protected currentUser: GroupMember | undefined;
	protected groupType = GroupType;

	protected group$ = this.store.select(RouterSelector.selectParams).pipe(
		filter(params => !!params["id"]),
		switchMap(params => this.store.select(GroupSelector.selectGroup(params["id"])).pipe(
			tap(group => {
				this.isEdit = true;
				this.form.patchValue({ ...group });
				this.selectedIndex = groupImages.findIndex(g => g.alt === group?.imageUrl);
				this.currentUser = Object.values(group?.members ?? {}).find(member => this.isCurrentUser(member));
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
					action: () => this.leaveGroup()
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

	protected getGroupCode() {
		this.store.dispatch(GroupAction.getCode({ id: this.form.controls.id.value }));
	}

	protected addVirutalMember(name: string) {
		this.store.dispatch(GroupAction.addVirtualMember({ groupId: this.form.controls.id.value, name }));
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

	protected removeMember(memberId?: string) {
		this.store.dispatch(GroupAction.removeMember({ id: this.form.controls.id.value, memberId }));
	}

	protected leaveGroup() {
		this.dialog.open({
			data: {
				message: "Are you sure want to leave this group?",
				actionButtons: [
					{
						type: DialogButtonType.Close,
						label: "Cancel"
					},
					{
						type: DialogButtonType.Primary,
						label: "Yes",
						action: () => this.removeMember()
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
