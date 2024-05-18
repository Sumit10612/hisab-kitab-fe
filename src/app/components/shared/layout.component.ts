import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";

import { PageNavHeaderComponent } from "./page-nav-header.component";

@Component({
	selector: "app-layout",
	standalone: true,
	imports: [CommonModule, MatCardModule, PageNavHeaderComponent],
	template: `
    <div class="container">      
      <div class="container-header-section">
        @if (showNav) {
          <app-page-nav-header [title]="pageTitle"></app-page-nav-header>
        }
        <ng-content select="[section='header']"></ng-content>
      </div>
      <mat-card class="container-detail-section">
        <ng-content select="[section='detail']"></ng-content>
      </mat-card>
    </div>
  `,
	styles: [`
    .container {
      display: flex;
      flex-direction: column;
      background-color: #964b04;
      height: 100vh;

      &-header-section {
        height: 250px;
        padding: 16px;
      }

      &-detail-section {
        flex: 1;
        border-radius: 32px 32px 0 0;
      }
    }
  `]
})
export class LayoutComponent {
  @Input() showNav: boolean = false;
  @Input() pageTitle: string | undefined;
}
