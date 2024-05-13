export interface CategoryGroup {
    name: string;
    categories: Category[];
}

export interface Category {
    id: number;
    name: string;
    icon: string;
}

export const filterCategories = (opt: Category[], value: string): Category[] => {
	const filterValue = value.toLowerCase();

	return opt.filter(item => item.name.toLowerCase().includes(filterValue));
};

export const getCategoryById = (id: number): Category | undefined => {
	for (const group of categoriesByGroup) {
		const category = group.categories.find(cat => cat.id === id);
		if (category) {
			return category;
		}
	}
	return undefined;
};

export const categoriesByGroup: CategoryGroup[] = [
	{
		name: "Entertainment",
		categories: [
			{ id: 1, name: "Games", icon: "sports_esports" },
			{ id: 2, name: "Movies", icon: "movie" },
			{ id: 3, name: "Music", icon: "music_note" },
			{ id: 4, name: "Sports", icon: "sports_soccer" },
			{ id: 5, name: "Others", icon: "confirmation_number" },
		]
	},
	{
		name: "Food & drink",
		categories: [
			{ id: 6, name: "Dining out", icon: "" },
			{ id: 7, name: "Groceries", icon: "" },
			{ id: 8, name: "Liquor", icon: "" }
		]
	}
];