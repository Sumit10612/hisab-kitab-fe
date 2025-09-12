/* eslint-disable @typescript-eslint/no-explicit-any */
import { TemplateRef } from "@angular/core";

export interface DialogData<TData = any> {
    readonly actionButtons?: DialogActionButton<TData>[];
    readonly title?: string;
    readonly titleIcon?: string;
    readonly message?: string | string[];
    readonly template?: TemplateRef<unknown>;
    data?: TData;
}

export interface DialogActionButton<TData = any> {
    type?: DialogButtonType;
    label: string | ((data?: TData) => string);
    disabled?: (data?: TData) => boolean;
    icon?: string;
    action?: (data?: TData) => void;
}

export enum DialogButtonType {
    Primary,
    Secondary,
    Close,
    Warn,
}
