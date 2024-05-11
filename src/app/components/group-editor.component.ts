import { Component, inject } from '@angular/core';

import { PageNavHeaderComponent } from './shared/page-nav-header.component';
import { GroupService } from '../services/group.service';
import { getGroupImage } from '../models/group.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { GroupWidgetComponent } from './widgets/group-widget.component';
import { LayoutComponent } from './shared/layout.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { AddExpenseComponent } from './widgets/add-expense.component';

@Component({
  selector: 'app-group-editor',
  standalone: true,
  imports: [
    MatCardModule,
    MatBottomSheetModule,
    MatButtonToggleModule,
    MatIconModule,
    MatButtonModule,
    PageNavHeaderComponent,
    GroupWidgetComponent,
    LayoutComponent,
    RouterLink
  ],
  template: `
    <app-layout>
      <div section="header" class="header-section">
        <app-page-nav-header
            backRoute="/home" 
            [title]="$group()?.name"
            [template]="settingsRouteTemplate">
        </app-page-nav-header>

        <div class="header-section-group-info">
            @if ($group()) {
                <img
                    width="50"
                    height="50"
                    [src]="getGroupImage($group()?.imageUrl).src"
                    [alt]="getGroupImage($group()?.imageUrl).alt" />
                
                <span>Total Balance</span>
            }
        </div>

        <div class="header-section-tab">
            <mat-button-toggle-group
                [(value)]="selectedTab"
                hideSingleSelectionIndicator="true"
                >
                <mat-button-toggle value="expense">Expense</mat-button-toggle>
                <mat-button-toggle value="summary">Summary</mat-button-toggle>
            </mat-button-toggle-group>
        </div>
      </div>

      <div section="detail" class="detail-section">
        <mat-card-content>
            @if (selectedTab === "expense") {
                Expenses
            } @else {
                Summary
            }
        </mat-card-content>
      </div>
    </app-layout>

    <div class="add-expense-button">
      <button mat-fab color="warn" (click)="addExpense()">
        <mat-icon>add</mat-icon>
      </button>
    </div>

    <ng-template #settingsRouteTemplate>
        <a role="button" mat-icon-button [routerLink]="['/group/settings', $group()?.uid]">
            <mat-icon>settings</mat-icon>
        </a>
    </ng-template>
  `,
  styles: [`
    .header-section {
      margin: -16px;
      padding: 16px 16px 0 16px;

      &-group-info {
          margin: 0 16px;
          display: flex;
          gap: 16px;
      }

      &-tab {
          margin-top: 16px;
          text-align: center;
      }
    }

    .detail-section {
        height: calc(100vh - 176px);
    }

    .mat-button-toggle-group {
        border-radius: 16px;
    }

    .mat-button-toggle-group {
        height: 32px;
        align-items: center;
    }

    .add-expense-button {
        position: absolute;
        right: 24px;
        bottom: 24px;
    }
  `]
})
export class GroupEditorComponent {
  private readonly groupService = inject(GroupService);
  private readonly route = inject(ActivatedRoute);
  private readonly bottomSheet = inject(MatBottomSheet);

  protected getGroupImage = getGroupImage;
  protected selectedTab: string = "expense";
  protected $group = toSignal(this.route.paramMap.pipe(
    switchMap(params => {
      const id = params.get('id');
      return this.groupService.currentGroup$(id ?? "");
    })
  ));

  ngOnInit() {
    this.addExpense();
  }

  addExpense() {
    this.bottomSheet.open(AddExpenseComponent, {
      disableClose: true,
    });
  }
}
