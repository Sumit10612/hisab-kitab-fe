import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  private history: string[] = []

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ).subscribe(curUrl => {
      if(curUrl === "/" || curUrl === "/home") {
        this.clearRouteHistory();
      }

      if (!this.history.includes(curUrl)) {
        this.history.push(curUrl);
      }
    });
  }

  navigateBack() {
    this.history.pop(); 
    const backUrl = this.history.length > 0 ? this.history[this.history.length - 1] : '/';
    this.router.navigate([backUrl])
  }

  navigateTo(route: string[]) {
    this.router.navigate(route);
  }

  clearRouteHistory() {
    this.history = [];
  }
}
