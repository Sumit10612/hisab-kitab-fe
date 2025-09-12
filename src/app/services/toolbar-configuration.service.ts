import { Injectable, signal } from "@angular/core";

import { ToolbarConfiguration } from "../models/toolbar.model";

@Injectable({
    providedIn: "root",
})
export class ToolbarConfigurationService {
    private configuration = signal<ToolbarConfiguration | undefined>(undefined);

    get config() {
        return this.configuration();
    }

    configure(config?: ToolbarConfiguration) {
        this.configuration.set(config);
    }
}
