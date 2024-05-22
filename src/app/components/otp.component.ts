import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	inject,
	OnDestroy,
	OnInit,
	ViewChild
} from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Subscription } from "rxjs";

import { DialogData } from "../models/dialog.model";
import { Otp } from "../models/otp.model";

@Component({
	selector: "app-otp-selector",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule
	],
	template: `  
	<div class="heading">Please enter a four digit code</div>
	<form [formGroup]="otpForm">
		<div class="container">
		<mat-form-field appearance="outline">
			<input type="number" matInput [formControl]="otpForm.controls.code1" #input1>
		</mat-form-field>
		<mat-form-field appearance="outline">
			<input type="number" matInput [formControl]="otpForm.controls.code2" #input2>
		</mat-form-field>
		<mat-form-field appearance="outline">
			<input type="number" matInput [formControl]="otpForm.controls.code3" #input3>
		</mat-form-field>
		<mat-form-field appearance="outline">
			<input type="number" matInput [formControl]="otpForm.controls.code4" #input4>
		</mat-form-field>
		</div>
	</form>
  `,
	styles: [`
	.heading {
		margin: 0 0 16px 0;
	}

	.container {
		display: flex;
		gap: 8px;

		> mat-form-field {
		width: 64px;

		> input {
			text-align: center;
		}
		}
	}

	input[type="number"]::-webkit-inner-spin-button,
	input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	`]
})
export class OtpComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild("input1") input1: ElementRef<HTMLInputElement> | undefined;
	@ViewChild("input2") input2: ElementRef<HTMLInputElement> | undefined;
	@ViewChild("input3") input3: ElementRef<HTMLInputElement> | undefined;
	@ViewChild("input4") input4: ElementRef<HTMLInputElement> | undefined;

	private readonly formBuilder = inject(NonNullableFormBuilder);
	private readonly cd = inject(ChangeDetectorRef);

	private code1Subscription: Subscription | undefined;
	private code2Subscription: Subscription | undefined;
	private code3Subscription: Subscription | undefined;
	private code4Subscription: Subscription | undefined;

	protected otpForm = this.formBuilder.group({
		code1: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(9)]),
		code2: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(9)]),
		code3: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(9)]),
		code4: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(9)]),
	});

	constructor(@Inject(MAT_DIALOG_DATA) public dialogData: DialogData<Otp>) { }

	ngOnInit() {
		this.dialogData.data = {};

		this.code1Subscription = this.otpForm.controls.code1.valueChanges.subscribe(code => {
			if (code != null) {
				this.input2?.nativeElement.focus();
				this.dialogData.data = { ...this.dialogData.data, code1: code };
			}
		});

		this.code2Subscription = this.otpForm.controls.code2.valueChanges.subscribe(code => {
			if (code != null) {
				this.input3?.nativeElement.focus();
				this.dialogData.data = { ...this.dialogData.data, code2: code };
			}
		});

		this.code3Subscription = this.otpForm.controls.code3.valueChanges.subscribe(code => {
			if (code != null) {
				this.input4?.nativeElement.focus();
				this.dialogData.data = { ...this.dialogData.data, code3: code };
			}
		});

		this.code4Subscription = this.otpForm.controls.code4.valueChanges.subscribe(code => {
			if (code != null) {
				this.dialogData.data = { ...this.dialogData.data, code4: code };
			}
		});
	}

	ngAfterViewInit(): void {
		this.input1?.nativeElement.focus();
		this.cd.detectChanges();
	}

	ngOnDestroy(): void {
		this.code1Subscription?.unsubscribe();
		this.code2Subscription?.unsubscribe();
		this.code3Subscription?.unsubscribe();
		this.code4Subscription?.unsubscribe();
	}
}
