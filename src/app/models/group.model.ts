import { Image } from "./image.model";

export interface GroupUser {
	uid: string;
	name: string;
	photoUrl?: string;
	role?: "admin" | "user";
}

export interface CreateGroup {
    name: string;
    imageUrl: string;
}

export interface Group extends CreateGroup {
    uid?: string;
	userIds: string[];
	users: GroupUser[];
}

export interface GroupExpenses {
	groupId: string;
}

export const getGroupImage = (alt?: string) => {
	if(!alt) {
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