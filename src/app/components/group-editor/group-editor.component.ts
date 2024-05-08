import { Component } from "@angular/core";

import { PageNavHeaderComponent } from "../shared/page-nav-header.component";

@Component({
	selector: "app-group-editor",
	standalone: true,
	imports: [
		PageNavHeaderComponent
	],
	templateUrl: "./group-editor.component.html",
	styleUrl: "./group-editor.component.scss"
})
export class GroupEditorComponent {

}
