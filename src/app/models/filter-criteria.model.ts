export interface FilterCriteria {
	dateOption: DateOption;
	fromDate?: Date;
	toDate?: Date;
}

export enum DateOption {
	Current,
	Last,
	Custom
}