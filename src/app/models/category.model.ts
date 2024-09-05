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
		name: "",
		categories: [
			{ id: 101, name: "Others", icon: "●" },
			{ id: 102, name: "Travel", icon: "✈️" },
			{ id: 103, name: "Fuel", icon: "⛽" },
			{ id: 104, name: "Investment", icon: "🏦" },
			{ id: 105, name: "Bills", icon: "🧾" },
			{ id: 106, name: "EMI", icon: "💸" },
		]
	},
	{
		name: "Entertainment",
		categories: [
			{ id: 201, name: "Shopping", icon: "🛍️" },
			{ id: 202, name: "Movies", icon: "🎥" },
			{ id: 203, name: "Entertainment", icon: "🎞️" },
			{ id: 204, name: "Sports", icon: "🏸" },
			{ id: 205, name: "Salon", icon: "💇‍♀️" },
		]
	},
	{
		name: "Food & drink",
		categories: [
			{ id: 301, name: "Dining", icon: "🍽️" },
			{ id: 302, name: "Groceries", icon: "🛒" },
			{ id: 303, name: "Liquor", icon: "🍺" },
			{ id: 304, name: "Vegitable", icon: "🫛" },
			{ id: 305, name: "Dairy", icon: "🥛" },
			{ id: 306, name: "Food", icon: "🍔" },
			{ id: 307, name: "Beverage", icon: "🍵" },
			{ id: 308, name: "Non Veg", icon: "🍗" },
			{ id: 309, name: "Fruits", icon: "🍇 " }
		]
	},
	{
		name: "Home",
		categories: [
			{ id: 401, name: "Electronics", icon: "📺" },
			{ id: 402, name: "Furniture", icon: "🪑" },
			{ id: 403, name: "Household supplies", icon: "🏠" },
			{ id: 404, name: "Maintenance", icon: "🛠️" },
		]
	}
];