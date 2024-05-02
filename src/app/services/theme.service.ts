import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<string>("light");

  setTheme(name: string) {
    this.theme.set(name);
  }

  updateTheme() {
    this.theme.update(theme => theme === "dark" ? "light" : "dark");
  }
}
