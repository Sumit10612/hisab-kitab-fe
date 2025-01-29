export interface Category {
	name: string;
	categories: SubCategory[];
}

export interface SubCategory {
	id: number;
	name: string;
	icon: string;
}

export const filterCategories = (opt: SubCategory[], value: string): SubCategory[] => {
	const filterValue = value.toLowerCase();

	return opt.filter(item => item.name.toLowerCase().includes(filterValue));
};

export const getCategoryById = (id: number): SubCategory | undefined => {
	for (const group of categoriesByGroup) {
		const category = group.categories.find(cat => cat.id === id);
		if (category) {
			return category;
		}
	}
	return undefined;
};

export const categoriesByGroup: Category[] = [
	{
		name: "Misc",
		categories: [
			{ id: 101, name: "Others", icon: "●" },
			{ id: 103, name: "Fuel", icon: "⛽" },
			{ id: 104, name: "Investment", icon: "🏦" },
			{ id: 105, name: "Bills", icon: "🧾" },
			{ id: 106, name: "EMI", icon: "💸" },
			{ id: 107, name: "Stationary", icon: "🖊️" },
		]
	},
	{
		name: "Travel",
		categories: [
			{ id: 102, name: "Travel", icon: "🚀" },
			{ id: 601, name: "Bus", icon: "🚎" },
			{ id: 602, name: "Train", icon: "🚂" },
			{ id: 603, name: "Flight", icon: "🛩️" },
			{ id: 604, name: "Cab", icon: "🚕" },
			{ id: 605, name: "Ferry", icon: "🚢" },
			{ id: 606, name: "Auto", icon: "🛺" },
			{ id: 607, name: "Toll", icon: "🛣️" },
			{ id: 608, name: "Parking", icon: "🅿️" },
			{ id: 609, name: "Hotel", icon: "🏨" },
		]
	},
	{
		name: "Entertainment",
		categories: [
			{ id: 201, name: "Shopping", icon: "🛍️" },
			{ id: 202, name: "Movies", icon: "🎥" },
			{ id: 203, name: "Entertainment", icon: "🎭" },
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
			{ id: 304, name: "Vegitable", icon: "🥦" },
			{ id: 305, name: "Dairy", icon: "🥛" },
			{ id: 306, name: "Food", icon: "🍔" },
			{ id: 307, name: "Beverage", icon: "🍵" },
			{ id: 308, name: "Non Veg", icon: "🍗" },
			{ id: 309, name: "Fruits", icon: "🍎" },
			{ id: 310, name: "Snacks", icon: "🍿" },
		]
	},
	{
		name: "Home & Maintenance",
		categories: [
			{ id: 401, name: "Electronics", icon: "📱" },
			{ id: 402, name: "Furniture", icon: "🪑" },
			{ id: 403, name: "Household supplies", icon: "🏠" },
			{ id: 404, name: "Maintenance", icon: "🛠️" },
			{ id: 405, name: "Car", icon: "🚗" },
			{ id: 406, name: "Bike", icon: "🏍️" },
		]
	},
	{
		name: "Investment",
		categories: [
			{ id: 501, name: "Bank", icon: "🏦" },
			{ id: 502, name: "Stocks", icon: "📈" },
			{ id: 503, name: "MFs", icon: "📊" },
			{ id: 504, name: "Gold", icon: "🪙"},
			{ id: 505, name: "Gov Bonds", icon: "🪪"}
		]
	}
];