import { Component, inject, Input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

@Component({
	selector: "app-page-nav-header",
	standalone: true,
	imports: [MatIconModule, MatButtonModule, RouterLink],
	template: `
    <div class="page-section">
    <div>
      @if (backRoute) {
        <a role="button"
          mat-icon-button 
          [routerLink]="backRoute">
          <mat-icon>arrow_back_ios</mat-icon>
        </a>
      }
    </div>
    <div class="title"><h2>{{title}}</h2></div>
    <div class="c"></div>
  </div>
  `,
	styles: [`
    .page-section { 
      display: flex;
      gap: 16px;
    }
    
    .title {
      margin-top: 8px;
    }

    .c {
      margin-left: auto;
    }
  `]
})
export class PageNavHeaderComponent {
  @Input() title: string | undefined;
  @Input() backRoute: string | undefined;
}
