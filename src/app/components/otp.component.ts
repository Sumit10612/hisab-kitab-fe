import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    ElementRef,
    Inject,
    inject,
    OnInit,
    viewChild,
} from "@angular/core";
import {
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { filter, Subscription } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { DialogData } from "../models/dialog.model";
import { Otp } from "../models/otp.model";

@Component({
    selector: "app-otp-selector",
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
    ],
    template: `
        <div class="heading">Please enter a four digit code</div>
        <form [formGroup]="otpForm">
            <div class="container">
                <mat-form-field appearance="outline">
                    <input
                        type="number"
                        matInput
                        [formControl]="otpForm.controls.code1"
                        #input1
                    />
                </mat-form-field>
                <mat-form-field appearance="outline">
                    <input
                        type="number"
                        matInput
                        [formControl]="otpForm.controls.code2"
                        #input2
                    />
                </mat-form-field>
                <mat-form-field appearance="outline">
                    <input
                        type="number"
                        matInput
                        [formControl]="otpForm.controls.code3"
                        #input3
                    />
                </mat-form-field>
                <mat-form-field appearance="outline">
                    <input
                        type="number"
                        matInput
                        [formControl]="otpForm.controls.code4"
                        #input4
                    />
                </mat-form-field>
            </div>
        </form>
    `,
    styles: [
        `
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
        `,
    ]
})
export class OtpComponent implements OnInit, AfterViewInit {
    private readonly formBuilder = inject(NonNullableFormBuilder);
    private readonly cd = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);

    protected otpForm = this.formBuilder.group({
        code1: this.formBuilder.control<number | null>(null, [
            Validators.required,
            Validators.min(0),
            Validators.max(9),
        ]),
        code2: this.formBuilder.control<number | null>(null, [
            Validators.required,
            Validators.min(0),
            Validators.max(9),
        ]),
        code3: this.formBuilder.control<number | null>(null, [
            Validators.required,
            Validators.min(0),
            Validators.max(9),
        ]),
        code4: this.formBuilder.control<number | null>(null, [
            Validators.required,
            Validators.min(0),
            Validators.max(9),
        ]),
    });

    protected readonly input1 = viewChild("input1", {
        read: ElementRef<HTMLInputElement>,
    });
    protected readonly input2 = viewChild("input2", {
        read: ElementRef<HTMLInputElement>,
    });
    protected readonly input3 = viewChild("input3", {
        read: ElementRef<HTMLInputElement>,
    });
    protected readonly input4 = viewChild("input4", {
        read: ElementRef<HTMLInputElement>,
    });

    constructor(@Inject(MAT_DIALOG_DATA) public dialogData: DialogData<Otp>) {}

    ngOnInit() {
        this.dialogData.data = {};

        const controls = [
            {
                control: this.otpForm.controls.code1,
                nextInput: () => this.input2,
            },
            {
                control: this.otpForm.controls.code2,
                nextInput: () => this.input3,
            },
            {
                control: this.otpForm.controls.code3,
                nextInput: () => this.input4,
            },
            { control: this.otpForm.controls.code4, nextInput: null },
        ];

        controls.forEach(({ control, nextInput }, index) => {
            control.valueChanges
                .pipe(
                    takeUntilDestroyed(this.destroyRef),
                    filter((code): code is number => code !== null),
                )
                .subscribe((code) => {
                    this.dialogData.data = {
                        ...this.dialogData.data,
                        [`code${index + 1}`]: code,
                    };
                    if (nextInput) {
                        nextInput()()?.nativeElement.focus();
                    }
                });
        });
    }

    ngAfterViewInit(): void {
        this.input1()?.nativeElement.focus();
        this.cd.detectChanges();
    }
}
