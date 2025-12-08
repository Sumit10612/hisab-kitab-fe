import { Component } from "@angular/core";
import { provideNativeDateAdapter } from "@angular/material/core";

@Component({
    selector: "app-record-payment",
    standalone: true,
    imports: [],
    providers: [provideNativeDateAdapter()],
    template: `record payment`,
    styles: [``],
})
export class RecordPaymentComponent {}
