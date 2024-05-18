import {
	Component,
	inject,
	Input,
	OnDestroy,
	OnInit
} from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import { finalize, Subscription } from "rxjs";

import { groupImages, GroupMember } from "../models/group.model";
import { GroupService } from "../services/group.service";
import { NavigationService } from "../services/navigation.service";
import { NotificationService } from "../services/notification.service";

import { LayoutComponent } from "./shared/layout.component";

@Component({
	selector: "app-group-editor",
	standalone: true,
	imports: [
		LayoutComponent, 
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatDividerModule,
		MatCardModule,
		ReactiveFormsModule,
		MatIconModule,
		MatSlideToggleModule
	],
	template: `
    <app-layout [showNav]="true" [pageTitle]="id ? 'Settings' : 'Create a group'">
		<div section="header" class="create-group-section">
			<form [formGroup]="form" (ngSubmit)="create()">
				<mat-form-field>
					<mat-label>Group Name</mat-label>
					<input matInput [formControl]="form.controls.name" [readonly]="currentUser?.role !== 'admin'" />
				</mat-form-field>

				<div class="image-container">
					@for (item of groupImages; track item) {
						<div>
							<img
							width="48"
							height="48"
							[class.selected]="selectedIndex === $index"
							[src]="item.src"
							[alt]="item.alt"
							(click)="selectImage($index)" />
							<span>{{item.alt}}</span>
						</div>      
					}
				</div>
			</form>
		</div>

		<div section="detail" class="detail-section">
			@if (currentUser?.role === "admin") {
				<button 
					(click)="id ? update() : create()"
					mat-raised-button
					class="rounded-button"
					color="primary"
					[disabled]="!form.dirty || !(selectedIndex === 0 ? 1 : selectedIndex)">
						{{ id ? "Update" : "Create" }} Group
				</button>
			}

			@if (id) {
				<mat-card>
					<mat-card-header>
						<mat-card-subtitle>Members:</mat-card-subtitle>
					</mat-card-header>
					<mat-card-content>
						@for (member of members; track member) {
							<div class="user-info">
								<div class="user-details">
									<span>{{ member.name }}</span>
									@if (isAdmin(member)) { <span class="role">(admin)</span> }
								</div>
								@if (currentUser && isAdmin(currentUser)) {
									<div class="user-actions">
										<button mat-button>Delete</button>
										<button mat-button>
											Remove
										</button>
									</div>
								}
							</div>
							<mat-divider></mat-divider>
						}
					</mat-card-content>
				</mat-card>				
			}

			@if (id && currentUser?.role === "admin") {
				<button 
					mat-raised-button
					class="rounded-button"
					color="warn"
					(click)="deleteGroup()">
						Delete Group
				</button>
			}
		</div>
    </app-layout>
  `,
	styles:[`
	.create-group-section {
      margin: 16px;

      .image-container {
        display: flex;
        overflow-x: auto;
        margin-bottom: 24px;
        white-space: nowrap;

        > div {
          display: flex;
          flex-direction: column;
          align-items: center;

          > img {
            margin: 8px 8px 0 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          > span {
            margin-bottom: 8px;
          }

          .selected {
            transform: scale(1.4);
          }
        }        
      }
    }

    .detail-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
    	margin: 16px;
    	align-items: center;

		> mat-card {
			width: 100%;
			height: 250px;

			> mat-card-content {
				display: flex;
				flex-direction: column;

				.user-info {
					display: flex;
					align-items: center;
					justify-content: space-between;
				}

				.user-details {
					display: flex;
					align-items: center;

					> span:first-child {
						margin-right: 8px;
					}
				}

				.user-actions {
					display: flex;
					gap: 8px;

					> button {
						min-width: fit-content;
					}

					.mat-icon {
						transform: scale(0.7);
					}
				}
			}
		}
    }
  `]
})
export class GroupEditorComponent implements OnInit, OnDestroy {
	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);
	private readonly groupService = inject(GroupService);

	private groupSubscription$$: Subscription | undefined;

	protected readonly formBuilder = inject(NonNullableFormBuilder);

	protected  groupImages = groupImages;
	protected selectedIndex: number | undefined;
	protected form = this.formBuilder.group({
		name: ["", [Validators.required]],
	});
	protected members: GroupMember[] | undefined;
	protected currentUser: GroupMember | undefined;

	@Input() id: string = "";

	ngOnInit(): void {
		if(this.id) {
			this.groupSubscription$$ = this.groupService.get$(this.id).subscribe(group => {
				this.form.patchValue({ ...group });
				this.selectedIndex = groupImages.findIndex(g => g.alt === group.imageUrl);
				this.members = group.members;
				this.currentUser = this.members.find(member => this.isCurrentUser(member));
			});
		}
	}

	ngOnDestroy(): void {
		this.groupSubscription$$?.unsubscribe();
	}

	isAdmin(member: GroupMember) {
		return member.role === "admin";
	}

	isCurrentUser(member: GroupMember) {
		return member.name === "You";
	}

	selectImage(index: number) {
		this.selectedIndex = index;
		this.form.markAsDirty();
	}

	create() {
		const { name } = this.form.value;
		if(!name || this.selectedIndex == undefined) {
			return;
		}

		this.notification.showLoading();
		this.groupService.create$({
			name,
			imageUrl: groupImages[this.selectedIndex].alt,
			groupTotal: 0,
			members: [],
			monthTotal: {}
		}).pipe(
			finalize(() => this.notification.hideLoading())
		).subscribe({
			next: (id) => this.navigation.navigateTo(["/group-detail", id]), 
			error: (error) => this.notification.firebaseError(error) 
		});
	}

	async update() {
		const { name } = this.form.value;
		if(!name || this.selectedIndex == undefined) {
			return;
		}

		try {
			this.notification.showLoading();
			await this.groupService.update(this.id, name, groupImages[this.selectedIndex].alt);
			this.navigation.navigateTo(["/group-detail", this.id]);
		} catch (err) {
			this.notification.firebaseError(err);
		} finally {
			this.notification.hideLoading();
		}
	}

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
