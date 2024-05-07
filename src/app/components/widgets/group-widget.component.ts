import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Group, getGroupImage } from '../../models/group.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'group-widget',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterLink],
  template: `
  <mat-card routerLink="/create-group">
    <mat-card-content>
      <img
        width="66"
        height="66"
        [src]="getGroupImage(data?.imageUrl).src"
        [alt]="getGroupImage(data?.imageUrl).alt" />

      <div class="details-container">
        <div class="group-name">{{data?.name}}</div>
        <span>Total balance
          <mat-icon>currency_rupee</mat-icon>
          --
        </span>
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
