export const getYearMonth = (date: Date): string => `${date.getFullYear()}-${date.getMonth() + 1}`;

export const getPreviousMonth = (date: Date): Date => {
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

export const getStartOfMonth = (date: Date): Date => {
	return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date: Date): Date => {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};