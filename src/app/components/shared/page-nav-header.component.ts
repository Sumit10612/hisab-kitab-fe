import { CommonModule } from "@angular/common";
import { Component, Input, TemplateRef } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

@Component({
	selector: "app-page-nav-header",
	standalone: true,
	imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],
	template: `
    <div class="page-section">
    <div>
      @if (backRoute) {
        <a role="button" mat-icon-button [routerLink]="backRoute">
          <mat-icon>arrow_back_ios</mat-icon>
        </a>
      }
    </div>
    <div class="title"><h2>{{title}}</h2></div>
    <div class="end">
      @if(template) {
        <ng-container *ngTemplateOutlet="template"></ng-container>
      }
    </div>
  </div>
  `,
	styles: [`
    .page-section { 
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
    }
    
    .title {
      margin-top: 8px;
      text-align: center;
    }

    .end {
      text-align: right;
    }
  `]
})
export class PageNavHeaderComponent {
  @Input() title: string | undefined;
  @Input() backRoute: string | string[] | undefined;
  @Input() template: TemplateRef<any> | undefined;
}
