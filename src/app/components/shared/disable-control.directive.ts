import {
	Directive,
	inject,
	Input,
	OnChanges,
	OnInit,
	SimpleChanges
} from "@angular/core";
import { FormControl, NgControl } from "@angular/forms";

@Directive({
	selector: "[appDisableControl]",
	standalone: true
})
export class DisableControlDirective implements OnInit, OnChanges {
	private readonly ngControl = inject(NgControl);

	@Input() appDisableControl: boolean = false;

	ngOnInit(): void {
		if (this.ngControl.control) {
			this.toggleControlState(this.appDisableControl);
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (!this.ngControl.control || !changes["appDisableControl"]) {
			return;
		}

		this.toggleControlState(this.appDisableControl);
	}

	private toggleControlState(disabled: boolean) {
		const control = this.ngControl.control as FormControl;
		if (disabled) {
			control.disable();
		} else {
			control.enable();
		}
	}
}