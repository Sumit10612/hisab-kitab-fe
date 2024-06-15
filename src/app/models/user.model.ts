import { Image } from "./image.model";

export interface User {
	uid: string;
	name?: string;
	email?: string;
	photoUrl?: string;
	preferences?: UserPreferences;
}

export interface UserPreferences {
	theme?: string;
}

export const getUserImage = (alt?: string) => {
	const img = avatars.filter(avatar => avatar.alt === alt);
	return img[0] ?? avatars[0];
};

export const avatars: Image[] = [
	{ src: "/assets/avatar_0.png", alt: "avatar_0"},
	{ src: "https://img.icons8.com/emoji/96/man-beard.png", alt: "avatar_7" },
	{ src: "https://img.icons8.com/color/96/user-female.png", alt: "avatar_1" },
	{ src: "https://img.icons8.com/emoji/96/boy-emoji.png", alt: "avatar_5" },
	{ src: "https://img.icons8.com/keek/100/girl.png", alt: "avatar_2" },
	{ src: "https://img.icons8.com/color/96/donald-trump.png", alt: "avatar_8" },
	{ src: "https://img.icons8.com/keek/100/christmas-girl.png", alt: "avatar_3" },
	{ src: "https://img.icons8.com/keek/100/christmas-boy.png", alt: "avatar_6" },
	{ src: "https://img.icons8.com/fluency/96/pigtails-haircut.png", alt: "avatar_4" },
];