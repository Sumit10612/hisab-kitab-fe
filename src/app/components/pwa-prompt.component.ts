import { Component, Inject } from "@angular/core";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";

@Component({
	selector: "app-pwa-prompt",
	standalone: true,
	imports: [MatListModule, MatIconModule, MatButtonModule],
	template: `
    <div class="container">
      <h4><b>Hisab Kitab</b>: Track all your expenses at one place.</h4>

      <div class="screenshots">
        <img
          width="100"
          src="/assets/screenshot_1.png" />
      </div>
      
      @if (data.platform === "ios") {
        <span>To install this app on your device tap the Menu button and then 'Add to Home screen' button.</span>
      }

      <div class="button-group">
        <button mat-button (click)="close()">Close</button>
        @if (data.platform === "android") {
          <button mat-raised-button color="primary" (click)="installPwa()">Install App</button>
        }
      </div>
    </div>
  `,
	styles: [`
    .container {
      display: block;

      .screenshots {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }

      .button-group {
        float: right;
      }
    }
  `]
})
export class PwaPromptComponent {
	constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { platform: "ios" | "android"; event?: any },
    private bottomSheetRef: MatBottomSheetRef<PwaPromptComponent>
	) {}

	installPwa() {
		this.data.event.prompt();
		this.close();
	}

	close() {
		this.bottomSheetRef.dismiss();
	}
}
