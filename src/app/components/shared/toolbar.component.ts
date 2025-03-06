import { Component, inject } from "@angular/core";
import { ToolbarConfigurationService } from "../../services/toolbar-configuration.service";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { NavigationService } from "../../services/navigation.service";
import { Store } from "@ngrx/store";
import { UserSelector } from "../../store/user/user.selector";
import { getUserImage } from "../../models/user.model";
import { ToolbarButtonType } from "../../models/toolbar.model";
import { RouterLink } from "@angular/router";

@Component({
    selector: "app-toolbar",
    standalone: true,
    imports: [MatToolbarModule, MatIconModule, MatButtonModule, RouterLink],
    template: `
        <mat-toolbar class="toolbar">
            @if (toolbar.config?.back?.visible()) {
                <button mat-icon-button  (click)="navigation.navigateBack()">
                    <mat-icon>arrow_back</mat-icon>
                </button>
            }

            @if (toolbar.config?.profile?.visible && $user()) {
                <a routerLink="/profile">
                    <img
                        width="55" 
                        height="55"
                        [src]="getUserImage($user()?.photoUrl).src"
                        [alt]="getUserImage($user()?.photoUrl).alt" />
                </a>
            }

            @for (actionBtn of toolbar.config?.actionBtns; track $index) {
                @if (actionBtn.icon) {
                    <button mat-icon-button
                            [color]="getColor(actionBtn.type)"
                            [disabled]="actionBtn.disabled?.()"
                            [hidden]="!(actionBtn.visible?.() ?? true)"
                            [routerLink]="actionBtn.redirectTo?.()"
                            (click)="actionBtn.action?.()">
                        <mat-icon>{{actionBtn.icon}}</mat-icon> {{actionBtn.label}}
                    </button>
                } @else {
                    <button mat-raised-button
                            [color]="getColor(actionBtn.type)"
                            [disabled]="actionBtn.disabled?.()"
                            [hidden]="!(actionBtn.visible?.() ?? true)"
                            [routerLink]="actionBtn.redirectTo?.()"
                            (click)="actionBtn.action?.()">
                        {{actionBtn.label}}
                    </button>
                }
            }
        </mat-toolbar>
    `,
    styles: [`
        .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    `]
})
export class ToolbarComponent {
    private readonly store = inject(Store);
    
    protected readonly toolbar = inject(ToolbarConfigurationService);
    protected readonly navigation = inject(NavigationService);

    protected getUserImage = getUserImage;
    protected $user = this.store.selectSignal(UserSelector.select);
    
    getColor(type: ToolbarButtonType) {
        switch (type) {
            case ToolbarButtonType.Primary:
                return "primary";
            case ToolbarButtonType.Warn:
                return "warn";
            default:
                return "";
        }
    }
}