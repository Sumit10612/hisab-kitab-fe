import { Component, computed, inject, OnInit } from "@angular/core";
import {
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioChange, MatRadioModule } from "@angular/material/radio";
import { Store } from "@ngrx/store";

import { ToolbarButtonType } from "../models/toolbar.model";
import { AVATARS, User } from "../models/user.model";
import { ToolbarConfigurationService } from "../services/toolbar-configuration.service";
import { AuthActions } from "../store/auth/auth.action";
import { UserActions } from "../store/user/user.action";
import { UserSelector } from "../store/user/user.selector";

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
        @if ($user(); as user) {
            <app-layout headerHeight="320px" pageTitle="Profile">
                <div section="header">
                    <form [formGroup]="form">
                        <mat-form-field>
                            <mat-label>Name</mat-label>
                            <input
                                matInput
                                [formControl]="form.controls.name"
                            />
                        </mat-form-field>
                        <mat-form-field>
                            <input
                                matInput
                                [formControl]="form.controls.email"
                                readonly
                            />
                        </mat-form-field>
                        <div class="image-container">
                            @for (item of avatars; track item.id) {
                                <img
                                    width="50"
                                    height="50"
                                    [class.selected]="selectedIndex === $index"
                                    [src]="item.src"
                                    [alt]="item.alt"
                                    (click)="selectImage($index)"
                                />
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
                            [value]="user?.preferences?.theme ?? 'light'"
                            (change)="onThemeChange($event)"
                        >
                            <mat-radio-button value="light"
                                >Light</mat-radio-button
                            >
                            <mat-radio-button value="dark"
                                >Dark</mat-radio-button
                            >
                        </mat-radio-group>
                    </div>
                </div>
            </app-layout>
        }
    `,
    styles: [
        `
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
            }
        `,
    ],
})
export class ProfileEditorComponent implements OnInit {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly toolbar = inject(ToolbarConfigurationService);
    private store = inject(Store);

    protected form = this.fb.group({
        uid: ["", [Validators.required]],
        name: ["", [Validators.required]],
        email: ["", [Validators.required]],
        photoUrl: ["", [Validators.required]],
    });
    protected avatars = AVATARS;
    protected selectedIndex: number | undefined;

    protected readonly $user = computed(() => {
        const user = this.store.selectSignal(UserSelector.select)();
        this.form.patchValue({ ...user });
        this.selectedIndex = this.avatars.findIndex(
            (avatar) => avatar.alt === user?.photoUrl,
        );

        return user;
    });

    ngOnInit(): void {
        this.toolbar.configure({
            back: { visible: () => true },
            actionBtns: [
                {
                    type: ToolbarButtonType.Warn,
                    label: "Logout",
                    action: () => this.store.dispatch(AuthActions.logout()),
                },
                {
                    type: ToolbarButtonType.Primary,
                    label: "Update",
                    disabled: () => !this.form.dirty || !this.form.valid,
                    action: () => {
                        const { ...data } = this.form.value;
                        this.store.dispatch(
                            UserActions.update({ user: { ...data } as User }),
                        );
                        this.form.markAsPristine();
                    },
                },
            ],
        });
    }

    selectImage(index: number) {
        this.selectedIndex = index;
        this.form.controls.photoUrl.setValue(this.avatars[index].alt);
        this.form.markAsDirty();
    }

    onThemeChange($event: MatRadioChange) {
        const user = this.$user();
        if (user) {
            const preferences = {
                theme: $event.value,
            };

            this.store.dispatch(
                UserActions.update({ user: { ...user, preferences } }),
            );
        }
    }
}
