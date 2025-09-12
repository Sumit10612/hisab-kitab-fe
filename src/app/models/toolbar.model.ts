export interface ToolbarConfiguration {
    back?: ToolbarButton;
    profile?: ToolbarButton;

    actionBtns?: ToolbarActionButton[];
}

export interface ToolbarButton {
    visible?: () => boolean;
    action?: () => void;
    redirectTo?: () => string | string[];
}

export interface ToolbarActionButton extends ToolbarButton {
    type: ToolbarButtonType;
    label?: string;
    icon?: string;
    disabled?: () => boolean;
    visible?: () => boolean;
}

export enum ToolbarButtonType {
    Primary,
    Secondary,
    Warn,
}
