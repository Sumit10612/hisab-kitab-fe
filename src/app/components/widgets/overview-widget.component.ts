import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'overview-widget',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatDividerModule],
  template: `
  <div class="overview-widget mat-elevation-z20">
    <mat-card>
      <mat-card-content>
        <div class="overview-widget-header">
          <h3>Total Balance</h3>
          <h2>
            <mat-icon>currency_rupee</mat-icon>
            <span>0</span>
          </h2>
        </div>
        <mat-divider></mat-divider>
        <div class="overview-widget-content">
          <div>
            <span style="color: red; font-weight: 700;">--</span>
            <span>you owe</span>
          </div>
          <div>
            <span style="color: green; font-weight: 700;">--</span>
            <span>you are owed</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  </div>
  `,
  styles: [`
    .overview-widget {
      margin: 16px 0 24px 0;
      border-radius: 32px;
      
      .mat-mdc-card {
        border-radius: 32px;
        padding: 0 16px;
      }

      &-header {
        display: flex;
        justify-content: space-between;
      }

      &-content {
        margin-top: 16px;
        display: flex;
        justify-content: space-between;

        > div {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      }
    }
  `]
})
export class OverviewWidgetComponent {

}
