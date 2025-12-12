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
    position: "center" | "right";
    color: "primary" | "secondary" | "warn";
    label?: string;
    icon?: string;
    disabled?: () => boolean;
    visible?: () => boolean;
}
