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
    const img = AVATARS.filter((avatar) => avatar.alt === alt);
    return img[0] ?? AVATARS[0];
};

export const AVATARS: Image[] = [
    { id: 1, src: "/assets/avatar_0.png", alt: "avatar_0" },
    {
        id: 2,
        src: "https://img.icons8.com/emoji/96/man-beard.png",
        alt: "avatar_7",
    },
    {
        id: 3,
        src: "https://img.icons8.com/color/96/user-female.png",
        alt: "avatar_1",
    },
    {
        id: 4,
        src: "https://img.icons8.com/emoji/96/boy-emoji.png",
        alt: "avatar_5",
    },
    { id: 5, src: "https://img.icons8.com/keek/100/girl.png", alt: "avatar_2" },
    {
        id: 6,
        src: "https://img.icons8.com/color/96/donald-trump.png",
        alt: "avatar_8",
    },
    {
        id: 7,
        src: "https://img.icons8.com/keek/100/christmas-girl.png",
        alt: "avatar_3",
    },
    {
        id: 8,
        src: "https://img.icons8.com/keek/100/christmas-boy.png",
        alt: "avatar_6",
    },
    {
        id: 9,
        src: "https://img.icons8.com/fluency/96/pigtails-haircut.png",
        alt: "avatar_4",
    },
];
