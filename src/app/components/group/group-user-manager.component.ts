import {
    Component,
    Inject,
    inject,
    TemplateRef,
    ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialogRef } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { Store } from "@ngrx/store";

import { DialogButtonType } from "../../models/dialog.model";
import { GroupMember, MemberRole } from "../../models/group.model";
import { DialogService } from "../../services/dialog.service";
import { GroupAction } from "../../store/group/group.action";
import { GroupSelector } from "../../store/group/group.selector";
import { DialogComponent } from "../shared/dialog.component";
import { DividerComponent } from "../shared/divider.component";
import { MAT_BOTTOM_SHEET_DATA } from "@angular/material/bottom-sheet";

@Component({
    selector: "app-group-user-manager",
    imports: [
        FormsModule,
        MatButtonModule,
        MatInputModule,
        MatCardModule,
        MatIconModule,
        MatMenuModule,
        DividerComponent,
    ],
    template: `
        @if ($group(); as group) {
            <div class="container">
                <mat-card>
                    <mat-card-content>
                        @for (member of group.activeMembers; track member.id) {
                            <div class="user-info">
                                <span>
                                    {{ member.name }}{{ " " }}
                                    @if (member.role === role.admin) {
                                        <span class="user-info-role"
                                            >(admin)</span
                                        >
                                    }
                                    @if (member.isVirtual) {
                                        <span class="user-info-role"
                                            >(virtual)</span
                                        >
                                    }
                                </span>
                                @if (group.isCurrentMemberIsAdmin) {
                                    <button
                                        mat-icon-button
                                        [matMenuTriggerFor]="contextMenu"
                                        xPosition="before"
                                    >
                                        <mat-icon>more_horiz</mat-icon>
                                    </button>
                                    <mat-menu #contextMenu="matMenu">
                                        <button
                                            mat-menu-item
                                            (click)="toggelAdmin(member)"
                                            [disabled]="
                                                member.id ===
                                                    group.currentMember.id ||
                                                member.isVirtual
                                            "
                                        >
                                            {{
                                                member.role === role.admin
                                                    ? "Remove"
                                                    : "Make"
                                            }}
                                            admin
                                        </button>
                                        <button
                                            mat-menu-item
                                            (click)="
                                                removeMemberFromGroup(
                                                    member.id,
                                                    member.name
                                                )
                                            "
                                            [disabled]="
                                                member.id ===
                                                group.currentMember.id
                                            "
                                        >
                                            Remove
                                        </button>
                                    </mat-menu>
                                }
                            </div>

                            @if ($index !== group.activeMembers.length - 1) {
                                <app-divider></app-divider>
                            }
                        }
                    </mat-card-content>
                </mat-card>

                @if (group.isCurrentMemberIsAdmin) {
                    <div class="action-buttons">
                        <button
                            mat-raised-button
                            color="primary"
                            (click)="openInviteMemberDialog()"
                        >
                            Invite Member
                        </button>
                        <button
                            mat-raised-button
                            color="primary"
                            (click)="openAddVirtualMemberDialog()"
                        >
                            Add Virtual Member
                        </button>
                    </div>
                }
            </div>
        }

        <ng-template #addUserToGroupDialogTemplate>
            <div class="add-user-to-group-template">
                @if ($groupCode(); as code) {
                    <div class="code">{{ code }}</div>
                    <div class="timer">code is valid only for 5 minutes</div>
                    <p>
                        Others can join this group <br />
                        using the above code
                    </p>
                } @else {
                    Please wait, generating new code...
                }
            </div>
        </ng-template>

        <ng-template #addVirtualMemberToGroupDialogTemplate>
            <mat-form-field>
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="virtualMemberName" />
            </mat-form-field>
        </ng-template>
    `,
    styles: [
        `
            .container {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .mat-mdc-card {
                width: 100%;
                border-radius: 24px;

                > mat-card-content {
                    display: flex;
                    flex-direction: column;
                    max-height: calc(100vh - 296px);
                    overflow-y: auto;

                    .user-info {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;

                        &-role {
                            font-size: 0.7em;
                        }
                    }
                }
            }

            .action-buttons {
                display: flex;
                gap: 8px;
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
        `,
    ]
})
export class GroupUserManagerComponent {
    private readonly dialog = inject(DialogService);
    private readonly store = inject(Store);

    private addMemberDialogRef:
        | MatDialogRef<DialogComponent, unknown>
        | undefined;

    @ViewChild("addMemberDialogTemplate")
    private readonly addMemberDialogTemplate: TemplateRef<unknown> | undefined;

    @ViewChild("addUserToGroupDialogTemplate")
    private readonly addUserToGroupDialogTemplate:
        | TemplateRef<unknown>
        | undefined;

    @ViewChild("addVirtualMemberToGroupDialogTemplate")
    private readonly addVirtualMemberToGroupDialogTemplate:
        | TemplateRef<unknown>
        | undefined;

    protected virtualMemberName?: string;
    protected readonly role = MemberRole;
    protected readonly $group = this.store.selectSignal(
        GroupSelector.selectGroup(this.data),
    );
    protected readonly $groupCode = this.store.selectSignal(
        GroupSelector.selectCode(this.data),
    );

    constructor(@Inject(MAT_BOTTOM_SHEET_DATA) protected data: string) {}

    protected openAddMemberDialog() {
        this.addMemberDialogRef = this.dialog.open({
            data: {
                template: this.addMemberDialogTemplate,
            },
        });
    }

    protected openInviteMemberDialog() {
        const addMemberDialogRef = this.dialog.open({
            data: {
                template: this.addUserToGroupDialogTemplate,
                actionButtons: [
                    {
                        type: DialogButtonType.Close,
                        label: "Close",
                    },
                ],
            },
        });

        addMemberDialogRef.afterOpened().subscribe(async (_) => {
            this.store.dispatch(GroupAction.getCode({ id: this.data }));
            setTimeout(() => {
                addMemberDialogRef.close();
            }, 300000);
        });

        addMemberDialogRef
            .afterClosed()
            .subscribe((_) => this.addMemberDialogRef?.close());
    }

    protected openAddVirtualMemberDialog() {
        const dialogRef = this.dialog.open({
            data: {
                template: this.addVirtualMemberToGroupDialogTemplate,
                actionButtons: [
                    {
                        type: DialogButtonType.Close,
                        label: "Close",
                    },
                    {
                        type: DialogButtonType.Primary,
                        label: "Add",
                        disabled: () => !this.virtualMemberName,
                        action: () => {
                            if (this.virtualMemberName) {
                                this.store.dispatch(
                                    GroupAction.addVirtualMember({
                                        groupId: this.data,
                                        name: this.virtualMemberName,
                                    }),
                                );
                            }
                        },
                    },
                ],
            },
        });

        dialogRef.afterClosed().subscribe((_) => {
            this.virtualMemberName = undefined;
            this.addMemberDialogRef?.close();
        });
    }

    protected toggelAdmin(member: GroupMember) {
        this.store.dispatch(
            GroupAction.updateRole({
                id: this.data,
                memberId: member.id,
                role:
                    member.role === MemberRole.admin
                        ? MemberRole.user
                        : MemberRole.admin,
            }),
        );
    }

    protected removeMemberFromGroup(memberId: string, name: string) {
        this.dialog.open({
            data: {
                message: `Are you sure want to remove ${name} from this group?`,
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
                                    id: this.data,
                                    memberId,
                                }),
                            ),
                    },
                ],
            },
        });
    }
}
