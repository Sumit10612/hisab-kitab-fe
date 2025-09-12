import { inject, Injectable } from "@angular/core";
import {
    MatDialog,
    MatDialogConfig,
    MatDialogRef,
} from "@angular/material/dialog";

import { DialogComponent } from "../components/shared/dialog.component";
import { DialogData } from "../models/dialog.model";

@Injectable({
    providedIn: "root",
})
export class DialogService {
    private readonly dialog = inject(MatDialog);

    open<T extends DialogData>(
        config: MatDialogConfig<T>,
    ): MatDialogRef<DialogComponent> {
        return this.dialog.open(DialogComponent, {
            autoFocus: false,
            minWidth: 300,
            maxWidth: 468,
            ...config,
        });
    }
}
