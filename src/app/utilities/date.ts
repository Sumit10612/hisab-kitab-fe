export namespace DateUtilities {
	export const yearMonth = (date?: Date): string => {
		date = date ?? new Date();
		return `${date.getFullYear()}-${date.getMonth() + 1}`;
	};

	export const previousMonth = (date?: Date): Date => {
		date = date ?? new Date();
		const month = date.getMonth();
		const year = date.getFullYear();
		if (month === 0) {
			date.setFullYear(year - 1);
			date.setMonth(11);
		} else {
			date.setMonth(month - 1);
		}

		return date;
	};

	export const startOfMonth = (date: Date): Date => {
		return new Date(date.getFullYear(), date.getMonth(), 1);
	};

	export const endOfMonth = (date: Date): Date => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0);
	};
}