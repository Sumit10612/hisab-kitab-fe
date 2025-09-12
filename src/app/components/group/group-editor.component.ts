import {
    Component,
    computed,
    inject,
    input,
    OnInit,
    TemplateRef,
    viewChild,
} from "@angular/core";
import {
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { Store } from "@ngrx/store";

import { DialogButtonType, DialogData } from "../../models/dialog.model";
import {
    GROUP_IMAGES,
    GroupType,
    MemberRole,
    UpsertGroup,
} from "../../models/group.model";
import { Otp } from "../../models/otp.model";
import { ToolbarButtonType } from "../../models/toolbar.model";
import { DialogService } from "../../services/dialog.service";
import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { GroupAction } from "../../store/group/group.action";
import { GroupSelector } from "../../store/group/group.selector";
import { OtpComponent } from "../otp.component";
import { LayoutComponent } from "../shared/layout.component";

import { GroupCategoryManagerComponent } from "./group-category-manager.conponent";
import { GroupUserManagerComponent } from "./group-user-manager.component";
import { UserSelector } from "../../store/user/user.selector";
import { DividerComponent } from "../shared/divider.component";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: "app-group-editor",
    standalone: true,
    imports: [
        ReactiveFormsModule,
        LayoutComponent,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatIconModule,
        MatRadioModule,
        MatSlideToggleModule,
        OtpComponent,
        DividerComponent,
    ],
    template: `
        <app-layout
            headerHeight="224px"
            [pageTitle]="isEdit ? 'Settings' : 'Create a group'"
        >
            <div section="header">
                <mat-form-field>
                    <mat-label>Group Name</mat-label>
                    <input
                        matInput
                        [formControl]="form.controls.name"
                        [readonly]="isEdit && !isAdmin"
                    />
                </mat-form-field>
                <div class="image-container">
                    @for (image of groupImages; track image.id) {
                        <div>
                            <img
                                width="48"
                                height="48"
                                [class.selected]="selectedIndex === $index"
                                [src]="image.src"
                                [alt]="image.alt"
                                (click)="selectImage($index)"
                            />
                            <span>{{ image.alt }}</span>
                        </div>
                    }
                </div>
            </div>

            <div section="detail" class="detail-section">
                <mat-radio-group
                    labelPosition="after"
                    name="groupType"
                    [formControl]="form.controls.groupType"
                    [hidden]="isEdit"
                >
                    <mat-radio-button [value]="groupType.ExpenseTracker"
                        >Track Expenses</mat-radio-button
                    >
                    <mat-radio-button [value]="groupType.SpiltExpense"
                        >Split Bills</mat-radio-button
                    >
                </mat-radio-group>

                @if (
                    form.controls.groupType.value ===
                        groupType.ExpenseTracker &&
                    (!isEdit || isAdmin)
                ) {
                    <mat-slide-toggle
                        [formControl]="form.controls.excludeTotal"
                    >
                        &nbsp;&nbsp;exclude from combined total
                    </mat-slide-toggle>
                }

                @if ($group(); as group) {
                    <div class="row">
                        <mat-card (click)="manageMembers(group.id)">
                            <mat-card-content>
                                <span>Members</span>
                                <mat-icon>keyboard_arrow_right</mat-icon>
                            </mat-card-content>
                        </mat-card>
                        <mat-card (click)="manageCategories(group.id)">
                            <mat-card-content>
                                <span>Categories</span>
                                <mat-icon>keyboard_arrow_right</mat-icon>
                            </mat-card-content>
                        </mat-card>
                    </div>

                    <div class="action-buttons">
                        <button
                            mat-raised-button
                            color="warn"
                            (click)="leaveGroup()"
                        >
                            Leave Group
                        </button>

                        @if (isAdmin) {
                            <button
                                mat-raised-button
                                color="warn"
                                (click)="deleteGroup()"
                            >
                                Delete Group
                            </button>
                        }
                    </div>
                } @else {
                    <app-divider text="OR" [hidden]="form.dirty"></app-divider>
                    <button
                        mat-raised-button
                        color="primary"
                        (click)="openJoinGroupDialog()"
                        [hidden]="form.dirty"
                    >
                        Join Group
                    </button>
                }
            </div>
        </app-layout>

        <ng-template #joinGroupDialogTemplate>
            <app-otp-selector></app-otp-selector>
        </ng-template>
    `,
    styles: [
        `
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
                align-items: center;

                .action-buttons {
                    display: flex;
                    gap: 16px;
                    flex-direction: column;
                    width: 100%;
                    margin-bottom: 16px;
                }
            }

            .row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-gap: 16px;
            }

            .mat-mdc-card-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 500;
                font-size: 1.1em;
            }
        `,
    ],
})
export class GroupEditorComponent implements OnInit {
    private readonly dialog = inject(DialogService);
    private readonly toolbar = inject(ToolbarConfigurationService);
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly store = inject(Store);
    private readonly bottomSheet = inject(MatBottomSheet);

    private readonly joinGroupDialogTemplate = viewChild.required(
        "joinGroupDialogTemplate",
        { read: TemplateRef },
    );

    protected isEdit = false;
    protected selectedIndex: number | undefined;
    protected groupType = GroupType;
    protected readonly groupImages = GROUP_IMAGES;
    protected readonly form = this.fb.group({
        id: "",
        name: ["", [Validators.required]],
        imageUrl: ["", [Validators.required]],
        groupType: [GroupType.ExpenseTracker],
        excludeTotal: [false],
    });
    protected readonly $currentUser = this.store.selectSignal(
        UserSelector.select,
    );
    protected readonly $group = computed(() => {
        const group = this.store.selectSignal(
            GroupSelector.selectGroup(this.groupId()),
        )();
        if (group) {
            this.isEdit = true;
            this.form.patchValue({ ...group });
            this.selectedIndex = this.groupImages.findIndex(
                (g) => g.alt === group?.imageUrl,
            );
        }

        return group;
    });

    protected readonly groupId = input.required<string>();

    ngOnInit(): void {
        this.toolbar.configure({
            back: { visible: () => true },
            actionBtns: [
                {
                    type: ToolbarButtonType.Primary,
                    label: "Update",
                    disabled: () => !this.form.dirty || !this.form.valid,
                    visible: () => this.isEdit && this.isAdmin,
                    action: () => {
                        if (this.upsertGroup) {
                            this.store.dispatch(
                                GroupAction.update({
                                    id: this.form.controls.id.value,
                                    upsertGroup: this.upsertGroup,
                                }),
                            );
                            this.form.markAsPristine();
                        }
                    },
                },
                {
                    type: ToolbarButtonType.Primary,
                    label: "Create",
                    disabled: () => !this.form.dirty || !this.form.valid,
                    visible: () => !this.isEdit,
                    action: () => {
                        if (this.upsertGroup) {
                            this.store.dispatch(
                                GroupAction.create({
                                    upsertGroup: this.upsertGroup,
                                }),
                            );
                        }
                    },
                },
            ],
        });
    }

    protected get isAdmin(): boolean {
        const user = this.$currentUser();
        if (!user) {
            return false;
        }

        return this.$group()?.members?.[user.uid].role === MemberRole.admin;
    }

    protected get upsertGroup(): UpsertGroup | undefined {
        const { name, imageUrl, groupType, excludeTotal } = this.form.value;
        if (!name || !imageUrl) {
            return;
        }

        return { name, imageUrl, groupType, excludeTotal };
    }

    protected selectImage(index: number) {
        this.selectedIndex = index;
        this.form.controls.imageUrl.setValue(this.groupImages[index].alt);
        this.form.markAsDirty();
    }

    protected openJoinGroupDialog() {
        this.dialog.open<DialogData<Otp>>({
            data: {
                template: this.joinGroupDialogTemplate(),
                actionButtons: [
                    {
                        type: DialogButtonType.Close,
                        label: "Close",
                    },
                    {
                        type: DialogButtonType.Primary,
                        label: "Join",
                        disabled: (data) =>
                            data?.code1 == null ||
                            data.code2 == null ||
                            data.code3 == null ||
                            data.code4 == null,
                        action: (data) => {
                            const code =
                                +`${data?.code1}${data?.code2}${data?.code3}${data?.code4}`;
                            this.store.dispatch(
                                GroupAction.addMember({ code }),
                            );
                        },
                    },
                ],
            },
        });
    }

    protected create() {
        const { name, imageUrl, groupType, excludeTotal } = this.form.value;
        if (!name || !imageUrl) {
            return;
        }

        this.store.dispatch(
            GroupAction.create({
                upsertGroup: { name, imageUrl, groupType, excludeTotal },
            }),
        );
    }

    protected manageMembers(id: string): void {
        this.bottomSheet.open(GroupUserManagerComponent, {
            data: id,
        });
    }

    protected manageCategories(id: string): void {
        this.bottomSheet.open(GroupCategoryManagerComponent, {
            data: id,
        });
    }

    protected leaveGroup() {
        this.dialog.open({
            data: {
                message: "Are you sure want to leave this group?",
                actionButtons: [
                    {
                        type: DialogButtonType.Close,
                        label: "Cancel",
                    },
                    {
                        type: DialogButtonType.Primary,
                        label: "Yes",
                        action: () =>
                            this.store.dispatch(
                                GroupAction.removeMember({
                                    id: this.form.controls.id.value,
                                }),
                            ),
                    },
                ],
            },
        });
    }

    protected deleteGroup() {
        this.dialog.open({
            data: {
                message: "Are you sure want to delete this group?",
                actionButtons: [
                    {
                        type: DialogButtonType.Close,
                        label: "Cancel",
                    },
                    {
                        type: DialogButtonType.Primary,
                        label: "Yes",
                        action: () =>
                            this.store.dispatch(
                                GroupAction.deleteGroup({
                                    id: this.form.controls.id.value,
                                }),
                            ),
                    },
                ],
            },
        });
    }
}
