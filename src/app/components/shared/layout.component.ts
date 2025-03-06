import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

@Component({
	selector: "app-layout",
	standalone: true,
	imports: [CommonModule],
	template: `
		<div class="container" [ngStyle]="getHeaderHeight">
			@if (pageTitle(); as pageTitle) {
				<h2>{{pageTitle}}</h2>
			}
			<ng-content select="[section='header']"></ng-content>
		</div>
		<ng-content select="[section='detail']"></ng-content>
  `,
	styles: [`
		.container {
			background: #964b04;
			position: relative;
			padding: 16px 16px 0 16px;

			> h2 {
				text-align: center;
			}
		}

		.container::before,
		.container::after {
			content: '';
			position: absolute;
			bottom: -48px;
			height: 48px;
			width: 24px;
			background-color: transparent;
		}

		.container::before {
			left: 0;
			border-radius: 24px 0;
			box-shadow: 0 -24px 0 0 #964b04;
		}

		.container::after {
			right: 0;
			border-radius: 0 24px;
			box-shadow: 0 -24px 0 0 #964b04;
		}
	`]
})
export class LayoutComponent {
	readonly pageTitle = input("");
	readonly headerHeight = input("154px");

	protected get getHeaderHeight() {
		return {
			height: this.headerHeight()
		};
	}
}
