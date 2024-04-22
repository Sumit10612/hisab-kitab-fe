import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  snackbar = inject(MatSnackBar);

  loading = signal(false);

  showLoading() {
    this.loading.set(true);
  }

  hideLoading() {
    this.loading.set(false);
  }

  success(message: string) {
    this.snackbar.open(message, undefined, {
      duration: 2000,
      verticalPosition: "top",
      horizontalPosition: "center",
    });
  }

  error(message: string) {
    this.snackbar.open(message, "Close", {
      verticalPosition: "top",
      horizontalPosition: "center",
    })
  }
}
