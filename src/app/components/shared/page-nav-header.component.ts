import { CommonModule } from "@angular/common";
import { Component, Input, TemplateRef, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { NavigationService } from "../../services/navigation.service";

@Component({
	selector: "app-page-nav-header",
	standalone: true,
	imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],
	template: `
    <div class="page-section">
      <button mat-icon-button (click)="navigateBack()">
        <mat-icon>arrow_back_ios</mat-icon>
      </button>
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
  private readonly navigation = inject(NavigationService);

  @Input() title: string | undefined;
  @Input() template: TemplateRef<unknown> | undefined;

  navigateBack() {
    this.navigation.navigateBack();
  }
}
