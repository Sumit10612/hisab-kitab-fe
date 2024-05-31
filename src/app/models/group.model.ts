import { Timestamp } from "@angular/fire/firestore";

import { Image } from "./image.model";

export enum GroupType {
	ExpenseTracker,
	SpiltExpense
}

export interface Group {
	id?: string;
	name: string;
	imageUrl: string;
	members: GroupMember[];
	groupTotal: number;
	monthTotal: Record<string, number>;
	groupType?: GroupType;
	excludeTotal?: boolean;
}

export interface GroupMember {
	id: string;
	name: string;
	role?: "admin" | "user";
	active?: boolean;
}

export interface GroupCode {
	code: number;
	timestamp: Timestamp;
}

export const toFirestore = (code: number): GroupCode => {
	return { code, timestamp: Timestamp.fromDate(new Date()) };
};

export const isExpired = (groupCode: GroupCode): boolean => {
	const date = groupCode.timestamp.toDate();
	date.setMinutes(date.getMinutes() + 5);
	return (new Date()).getTime() > date.getTime();
};

export const getGroupImage = (alt?: string) => {
	if (!alt) {
		alt = "avatar_0";
	}

	return groupImages.filter(img => img.alt === alt)[0];
};

export const groupImages: Image[] = [
	{ src: "https://img.icons8.com/fluency/96/home.png", alt: "Home" },
	{ src: "https://img.icons8.com/fluency/96/sunbathe.png", alt: "Vacation" },
	{ src: "https://img.icons8.com/color/96/person-male.png", alt: "Personal" },
	{ src: "https://img.icons8.com/fluency/96/office.png", alt: "Office" },
	{ src: "https://img.icons8.com/fluency/96/ping-pong.png", alt: "Sports" },
	{ src: "https://img.icons8.com/color/96/group.png", alt: "Others" },
];