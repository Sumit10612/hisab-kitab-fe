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
			{ id: 101, name: "Others", icon: "format_list_bulleted" },
			{ id: 102, name: "Travel", icon: "airport_shuttle" },
			{ id: 103, name: "Fuel", icon: "local_gas_station" },
			{ id: 104, name: "Investment", icon: "savings" },
			{ id: 105, name: "Bills", icon: "receipt_long" },
			{ id: 106, name: "EMI", icon: "incomplete_circle" },
		]
	},
	{
		name: "Entertainment",
		categories: [
			{ id: 201, name: "Shopping", icon: "shopping_cart" },
			{ id: 202, name: "Movies", icon: "movie" },
			{ id: 203, name: "Entertainment", icon: "confirmation_number" },
			{ id: 204, name: "Sports", icon: "sports_soccer" },
		]
	},
	{
		name: "Food & drink",
		categories: [
			{ id: 301, name: "Dining", icon: "dining" },
			{ id: 302, name: "Groceries", icon: "trolley" },
			{ id: 303, name: "Liquor", icon: "liquor" },
			{ id: 304, name: "Vegitable", icon: "eco" },
			{ id: 305, name: "Dairy", icon: "local_drink" },
			{ id: 306, name: "Food", icon: "fastfood" },
			{ id: 307, name: "Beverage", icon: "local_cafe" }

		]
	},
	{
		name: "Home",
		categories: [
			{ id: 401, name: "Electronics", icon: "tv_gen" },
			{ id: 402, name: "Furniture", icon: "chair" },
			{ id: 403, name: "Household supplies", icon: "household_supplies" },
			{ id: 404, name: "Maintenance", icon: "engineering" },
		]
	}
];