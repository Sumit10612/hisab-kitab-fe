import { Component, Input, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";

import { GroupService } from "../services/group.service";
import { NotificationService } from "../services/notification.service";

import { LayoutComponent } from "./shared/layout.component";
import { NavigationService } from "../services/navigation.service";

@Component({
	selector: "app-group-settings",
	standalone: true,
	imports: [
		LayoutComponent, 
		MatButtonModule
	],
	template: `
    <app-layout [showNav]="true" pageTitle="Settings">
      <div section="detail" class="detail-section">
        <button 
          mat-raised-button
          class="rounded-button"
          color="warn"
          (click)="deleteGroup()">
          Delete Group
        </button>
      </div>
    </app-layout>
  `,
	styles:[`
    .detail-section {
      margin: 16px;
      text-align: center;
    }
  `]
})
export class GroupSettingsComponent {
	private readonly groupService = inject(GroupService);
	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);

	@Input() id: string = "";

	async deleteGroup() {
		try {
			this.notification.showLoading();
			await this.groupService.delete(this.id);
			this.navigation.navigateTo(["/home"]);
		} catch (err) {
			this.notification.firebaseError(err);
		} finally {
			this.notification.hideLoading();
		}
	}
}
