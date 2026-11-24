import { Category } from "./category.model";

export const INVESTMENT_GROUP_NAME = "My Investments";
export const INVESTMENT_GROUP_IMAGE = "Investment";

export const investmentGroupId = (userId: string): string =>
    `investments_${userId}`;

// An asset class is a category with a single sub category. The existing expense
// editor stores the sub category id on the record, which is how an investment
// is matched to its asset class. When the editor's default selection is not an
// asset class of the group, the editor falls back to the first asset class.
export const DEFAULT_ASSET_CLASSES: Category[] = [
    { id: 2, name: "Fixed Deposit", icon: "🏦" },
    { id: 3, name: "Stocks", icon: "📈" },
    { id: 4, name: "Mutual Funds", icon: "💹" },
    { id: 5, name: "Gold", icon: "🪙" },
    { id: 6, name: "PPF/EPF/NPS", icon: "🛡️" },
    { id: 7, name: "Real Estate", icon: "🏠" },
    { id: 8, name: "Crypto", icon: "₿" },
].map(({ id, name, icon }) => ({
    id,
    name,
    subCategories: [{ id: 100 + id, name, icon }],
}));
