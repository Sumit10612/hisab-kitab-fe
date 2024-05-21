import {
	Component,
	ElementRef,
	EventEmitter,
	inject,
	Output,
	ViewChild
} from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

@Component({
	selector: "app-otp",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule
	],
	template: `  
    <div class="heading">Please enter a four digit group id</div>
    <form [formGroup]="otpForm" (ngSubmit)="onJoin()">
      <div class="container">
        <mat-form-field appearance="outline">
          <input type="number" min="0" max="9" matInput 
            [formControl]="otpForm.controls.otp1" 
            (keyup)="focusNext($event)"
            id="input1">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <input type="number" maxlength="1" matInput
            [formControl]="otpForm.controls.otp2"
            (keyup)="focusNext($event)"
            id="input2" #input2>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <input type="number" maxlength="1" matInput [formControl]="otpForm.controls.otp3" (keyup)="focusNext($event)" id="input3" #input3>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <input type="number" maxlength="1" matInput [formControl]="otpForm.controls.otp4" #input4>
        </mat-form-field>
      </div>
      <div class="btn-group">
        <button mat-button (click)="onClose()">Close</button>
        <button mat-raised-button type="submit" color="primary">Join</button>
      </div>
  </form>
  `,
	styles: [`
    .heading {
      margin: 16px 0;
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

    .btn-group {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `]
})
export class OtpComponent {
  @ViewChild("input1") input1: ElementRef<HTMLInputElement> | undefined;
  @ViewChild("input2") input2: ElementRef<HTMLInputElement> | undefined;
  @ViewChild("input3") input3: ElementRef<HTMLInputElement> | undefined;
  @ViewChild("input4") input4: ElementRef<HTMLInputElement> | undefined;

  @Output() onSubmit = new EventEmitter<number>();
  @Output() onCancel = new EventEmitter<void>();
  
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected otpForm = this.formBuilder.group({
  	otp1: ["", [Validators.required, Validators.minLength(1), Validators.maxLength(1), Validators.pattern(/^\d+$/)]],
  	otp2: ["", [Validators.required, Validators.minLength(1), Validators.maxLength(1), Validators.pattern(/^\d+$/)]],
  	otp3: ["", [Validators.required, Validators.minLength(1), Validators.maxLength(1), Validators.pattern(/^\d+$/)]],
  	otp4: ["", [Validators.required, Validators.minLength(1), Validators.maxLength(1), Validators.pattern(/^\d+$/)]],
  });

  focusNext($event: KeyboardEvent) {
  	const input = $event.target as HTMLInputElement;
  	const nextInput = this.getNextInput(input);
  	if(input.value.length === 1 && nextInput) {
  		nextInput.focus();
  	}
  }

  onClose() {
  	this.onCancel?.emit();
  }

  onJoin() {
  	const otp = (((+this.otpForm.controls.otp1.value * 10) +
      +this.otpForm.controls.otp2.value) * 10 +
      +this.otpForm.controls.otp3.value) * 10 +
      +this.otpForm.controls.otp4.value;

  	this.onSubmit?.emit(otp);
  }

  private getNextInput(currentInput: HTMLInputElement): HTMLInputElement | undefined {
  	switch (currentInput.id) {
  		case "input1":
  			return this.input2?.nativeElement;
  		case "input2":
  			return this.input3?.nativeElement;
  		case "input3":
  			return this.input4?.nativeElement;
  		default:
  			return undefined;
  	}
  }
}
