export interface ToolbarConfiguration {
	back?: ToolbarButton;
	profile?: ToolbarButton;

	actionBtns?: ToolbarActionButton[];
}

export interface ToolbarButton {
	visible?: boolean;
}

export interface ToolbarActionButton {
	type: ToolbarButtonType;
	label?: string;
	icon?: string;
	disabled?: () => boolean;
	visible?: () => boolean;
	action?: () => void;
	redirectTo?: () => string | string[];
}

export enum ToolbarButtonType {
	Primary,
	Secondary,
	Warn
}