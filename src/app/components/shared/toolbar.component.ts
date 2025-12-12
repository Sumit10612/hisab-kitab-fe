import { Component, inject } from "@angular/core";
import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { NavigationService } from "../../services/navigation.service";
import { Store } from "@ngrx/store";
import { UserSelector } from "../../store/user/user.selector";
import { getUserImage } from "../../models/user.model";
import { RouterLink } from "@angular/router";

@Component({
    selector: "app-toolbar",
    imports: [MatToolbarModule, MatIconModule, MatButtonModule, RouterLink],
    template: `
        <mat-toolbar class="toolbar">
            <div class="toolbar-section toolbar-left">
                @if (toolbar.config?.back?.visible()) {
                    <button
                        mat-mini-fab
                        color="secondary"
                        (click)="handleBackEvent()"
                        [routerLink]="toolbar.config?.back?.redirectTo?.()"
                    >
                        <mat-icon>arrow_back</mat-icon>
                    </button>
                }
                @if (toolbar.config?.profile?.visible && $user()) {
                    <a routerLink="/profile">
                        <img
                            width="55"
                            height="55"
                            [src]="getUserImage($user()?.photoUrl).src"
                            [alt]="getUserImage($user()?.photoUrl).alt"
                        />
                    </a>
                }
            </div>

            <div class="toolbar-section toolbar-center">
                @for (btn of toolbar.config?.actionBtns; track $index) {
                    @if (
                        btn.position === "center" && (btn.visible?.() ?? true)
                    ) {
                        @if (btn.icon) {
                            <button
                                mat-fab
                                [disabled]="btn.disabled?.()"
                                [routerLink]="btn.redirectTo?.()"
                                (click)="btn.action?.()"
                                class="center-fab"
                            >
                                <mat-icon>{{ btn.icon }}</mat-icon>
                            </button>
                        } @else {
                            <button
                                mat-raised-button
                                [color]="btn.color"
                                [disabled]="btn.disabled?.()"
                                [routerLink]="btn.redirectTo?.()"
                                (click)="btn.action?.()"
                            >
                                {{ btn.label }}
                            </button>
                        }
                    }
                }
            </div>

            <div class="toolbar-section toolbar-right">
                @for (btn of toolbar.config?.actionBtns; track $index) {
                    @if (
                        btn.position === "right" && (btn.visible?.() ?? true)
                    ) {
                        @if (btn.icon) {
                            <button
                                mat-mini-fab
                                [color]="btn.color"
                                [disabled]="btn.disabled?.()"
                                [routerLink]="btn.redirectTo?.()"
                                (click)="btn.action?.()"
                            >
                                <mat-icon>{{ btn.icon }}</mat-icon>
                            </button>
                        } @else {
                            <button
                                mat-raised-button
                                [color]="btn.color"
                                [disabled]="btn.disabled?.()"
                                [routerLink]="btn.redirectTo?.()"
                                (click)="btn.action?.()"
                            >
                                {{ btn.label }}
                            </button>
                        }
                    }
                }
            </div>
        </mat-toolbar>
    `,
    styles: [
        `
            .toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
                position: relative;
                overflow: visible;
            }

            .toolbar-section {
                flex: 1;
                display: flex;
                align-items: center;
            }

            .toolbar-left {
                justify-content: flex-start;
            }

            .toolbar-center {
                justify-content: center;
                position: relative;
                z-index: 10;
            }

            .toolbar-right {
                justify-content: flex-end;
                gap: 8px;
            }

            .center-fab {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -65%);
                width: 64px;
                height: 64px;
                background-color: #964b04 !important;

                mat-icon {
                    font-size: 32px;
                    width: 32px;
                    height: 32px;
                }
            }
        `,
    ],
})
export class ToolbarComponent {
    private readonly store = inject(Store);
    private readonly navigation = inject(NavigationService);

    protected readonly toolbar = inject(ToolbarConfigurationService);

    protected getUserImage = getUserImage;
    protected $user = this.store.selectSignal(UserSelector.select);

    protected handleBackEvent(): void {
        const action = this.toolbar.config?.back?.action;
        if (action) {
            action();
        } else {
            this.navigation.navigateBack();
        }
    }
}
