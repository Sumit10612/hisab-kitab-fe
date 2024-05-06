import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Group } from '../../models/group.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'group-widget',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterLink],
  template: `
  <mat-card routerLink="/create-group">
    <mat-card-content>
      <div class="icon-container">
        <mat-icon>{{data?.icon}}</mat-icon>
      </div>
      <div class="details-container">
        <div class="group-name">{{data?.name}}</div>
        <span>Total balance</span>
      </div>
    </mat-card-content>
  </mat-card>
  `,
  styles: [`
    .mat-mdc-card-content {
      display: flex;
      align-items: center;
    }

    .icon-container {
      flex: 20%;
      text-align: center;

      .mat-icon {
        transform: scale(2);
      }
    }

    .details-container {
      flex: 80%;
      padding-left: 16px;

      .group-name {
        font-size: 18px;
        margin-bottom: 8px;
      }
    }
  `]
})
export class GroupWidgetComponent {
  @Input() data: Group | undefined;
}
