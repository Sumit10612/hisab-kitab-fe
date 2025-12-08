import { Component, input } from "@angular/core";
import { MatDividerModule } from "@angular/material/divider";

@Component({
    selector: "app-divider",
    imports: [MatDividerModule],
    template: `
        @if (!hidden()) {
            <div class="container">
                <div class="divider"><mat-divider></mat-divider></div>
                @if (text(); as text) {
                    <span>{{ text }}</span>
                    <div class="divider"><mat-divider></mat-divider></div>
                }
            </div>
        }
    `,
    styles: [
        `
            .container {
                display: flex;
                flex-direction: row;
                justify-content: center;
                align-items: center;
                gap: 16px;
                margin: 8px 0;
            }

            .divider {
                flex: 1;
            }
        `,
    ]
})
export class DividerComponent {
    readonly text = input<string>();
    readonly hidden = input(false);
}
