export interface CategoryGroup {
    name: string;
    categories: Category[];
}

export interface Category {
    name: string;
    icon: string;
}

export const filterCategories = (opt: Category[], value: string): Category[] => {
    const filterValue = value.toLowerCase();

    return opt.filter(item => item.name.toLowerCase().includes(filterValue));
};
 

export const categoriesByGroup: CategoryGroup[] = [
    {
        name: "Entertainment",
        categories: [
            { name: "Games", icon: "sports_esports" },
            { name: "Movies", icon: "movie" },
            { name: "Music", icon: "music_note" },
            { name: "Sports", icon: "sports_soccer" },
            { name: "Others", icon: "confirmation_number" },
        ]
    },
    {
        name: "Food & drink",
        categories: [
            { name: "Dining out", icon: "" },
            { name: "Groceries", icon: "" },
            { name: "Liquor", icon: "" }
        ]
    }
]