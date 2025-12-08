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
    position: ToolbarButtonPosition;
    color: () => ToolbarButtonColor;
    label?: () => string;
    icon?: string;
    disabled?: () => boolean;
    visible?: () => boolean;
}

export enum ToolbarButtonColor {
    Primary,
    Secondary,
    Warn,
}

export enum ToolbarButtonPosition {
    Center,
    Right,
}
