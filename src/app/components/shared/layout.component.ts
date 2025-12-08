import { CommonModule } from "@angular/common";
import { Component, ElementRef, input, output, viewChild } from "@angular/core";
import { ToolbarComponent } from "./toolbar.component";

@Component({
    selector: "app-layout",
    imports: [CommonModule, ToolbarComponent],
    template: `
        <div class="header" [ngStyle]="getHeaderHeight">
            @if (pageTitle(); as pageTitle) {
                <h2>{{ pageTitle }}</h2>
            }
            <ng-content select="[section='header']"></ng-content>
        </div>
        <div
            class="detail"
            [ngStyle]="getDetailHeight"
            #scrollContainer
            (scroll)="onScroll()"
        >
            <ng-content select="[section='detail']"></ng-content>
        </div>
        <div class="bottom-toolbar">
            <app-toolbar></app-toolbar>
        </div>
    `,
    styles: [
        `
            .header {
                background: #964b04;
                position: relative;
                padding: 16px 16px 0 16px;

                > h2 {
                    text-align: center;
                }
            }

            .header::before,
            .header::after {
                content: "";
                position: absolute;
                bottom: -48px;
                height: 48px;
                width: 24px;
                background-color: transparent;
            }

            .header::before {
                left: 0;
                border-radius: 24px 0;
                box-shadow: 0 -24px 0 0 #964b04;
            }

            .header::after {
                right: 0;
                border-radius: 0 24px;
                box-shadow: 0 -24px 0 0 #964b04;
            }

            .detail {
                overflow-y: auto;
                padding: 16px;
            }

            .bottom-toolbar {
                position: fixed;
                bottom: 0;
                width: 100%;
                height: 56px;
            }
        `,
    ]
})
export class LayoutComponent {
    readonly pageTitle = input("");
    readonly headerHeight = input("154px");

    readonly triggerOnScroll = output<boolean>();

    protected readonly scrollContainer = viewChild.required("scrollContainer", {
        read: ElementRef,
    });

    protected get getHeaderHeight() {
        return {
            height: this.headerHeight(),
        };
    }

    protected get getDetailHeight() {
        return {
            height: `calc(100vh - 56px - 32px - ${this.headerHeight()})`,
        };
    }

    protected onScroll() {
        const element = this.scrollContainer().nativeElement;
        if (
            element.scrollHeight - element.clientHeight <=
            element.scrollTop + 1
        ) {
            this.triggerOnScroll.emit(true);
        }
    }
}
