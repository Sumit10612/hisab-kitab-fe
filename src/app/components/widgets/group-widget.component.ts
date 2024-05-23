import { Component, Input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

import { getGroupImage, Group } from "../../models/group.model";

@Component({
	selector: "app-group-widget",
	standalone: true,
	imports: [MatCardModule, MatIconModule, RouterLink],
	template: `
  <mat-card [routerLink]="['/group-detail', data?.id]" [skipLocationChange]="true">
    <mat-card-content>
      <img
        width="66"
        height="66"
        [src]="getGroupImage(data?.imageUrl).src"
        [alt]="getGroupImage(data?.imageUrl).alt" />

      <div class="details-container">
        <div class="group-name">{{data?.name}}</div>
        <span>Total balance &#8377;{{data?.groupTotal ?? 0}}</span>
      </div>
    </mat-card-content>
  </mat-card>
  `,
	styles: [`
    .mat-mdc-card-content {
      display: flex;
      align-items: center;
      padding: 8px;
    }

    .details-container {
      flex: 80%;
      margin-left: 24px;

      .group-name {
        font-size: 16px;
        font-weight: 500;
      }
    }

    .mat-icon {
      vertical-align: middle;
      transform: scale(0.6);
    }
  `]
})
export class GroupWidgetComponent {
	protected getGroupImage = getGroupImage;

	@Input() data: Group | undefined;
}
