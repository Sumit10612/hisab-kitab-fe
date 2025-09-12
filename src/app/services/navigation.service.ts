import { Location } from "@angular/common";
import { Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter, map } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class NavigationService {
    private history: string[] = [];

    constructor(
        private router: Router,
        private location: Location,
    ) {
        this.router.events
            .pipe(
                filter((e) => e instanceof NavigationEnd),
                map((e) => (e as NavigationEnd).urlAfterRedirects),
            )
            .subscribe((curUrl) => {
                if (curUrl === "/" || curUrl === "/home") {
                    this.clearRouteHistory();
                }

                if (!this.history.includes(curUrl)) {
                    this.history.push(curUrl);
                }
            });

        location.subscribe((_) => this.navigateBack());
    }

    navigateBack() {
        this.history.pop();
        const backUrl =
            this.history.length > 0
                ? this.history[this.history.length - 1]
                : "/";

        setTimeout(() => {
            this.router.navigate([backUrl]);
        }, 1);
    }

    navigateToHome() {
        this.router.navigate(["/home"]);
    }

    navigateToLogin() {
        this.router.navigate(["/login"]);
    }

    clearRouteHistory() {
        this.history = [];
    }
}
