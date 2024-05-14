import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, Router } from "@angular/router";
import { switchMap } from "rxjs";

import { GroupService } from "../services/group.service";
import { NotificationService } from "../services/notification.service";
import { getFirebaseErrorMessage } from "../utilities/firebase-errors";

import { LayoutComponent } from "./shared/layout.component";
import { PageNavHeaderComponent } from "./shared/page-nav-header.component";

@Component({
	selector: "app-group-settings",
	standalone: true,
	imports: [
		LayoutComponent, 
		PageNavHeaderComponent,
		MatButtonModule
	],
	template: `
    <app-layout>
      <div section="header">
        <app-page-nav-header 
          [backRoute]="['/group', $group()?.uid ?? '']"
          [title]="$group()?.name + ' - Settings'" >
        </app-page-nav-header>
      </div>

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
	private readonly route = inject(ActivatedRoute);
	private readonly notificationService = inject(NotificationService);
	private readonly router = inject(Router);

	protected $group = toSignal(this.route.paramMap.pipe(
		switchMap(params => {
			const id = params.get("id");
			return this.groupService.currentGroup$(id ?? "");
		})
	));

	async deleteGroup() {
		const groupId = this.$group()?.uid;
		if(!groupId) {
			return;
		}

		try
		{
			this.notificationService.showLoading();
			await this.groupService.deleteGroup(groupId);
			this.router.navigate(["/home"]);
		} catch (err) {
			this.notificationService.error(getFirebaseErrorMessage(err));
		} finally {
			this.notificationService.hideLoading();
		}
	}
}
