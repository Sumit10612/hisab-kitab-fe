export interface Category {
    id: number;
    name: string;
    subCategories: SubCategory[];
}

export interface SubCategory {
    id: number;
    name: string;
    icon: string;
}

export const filterCategories = (
    opt: SubCategory[],
    value: string,
): SubCategory[] => {
    const filterValue = value.toLowerCase();

    return opt.filter((item) => item.name.toLowerCase().includes(filterValue));
};

export const DEFAULT_CATEGORY: Category = {
    id: 1,
    name: "Others",
    subCategories: [
        {
            id: 101,
            name: "Others",
            icon: "●",
        },
    ],
};
