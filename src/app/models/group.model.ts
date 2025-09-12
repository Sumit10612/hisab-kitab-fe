import { Timestamp } from "@angular/fire/firestore";

import { Category } from "./category.model";
import { Image } from "./image.model";

export enum GroupType {
    ExpenseTracker,
    SpiltExpense,
}

export interface UpsertGroup {
    name: string;
    imageUrl: string;
    groupType?: GroupType;
    excludeTotal?: boolean;
}

export interface Group extends UpsertGroup {
    id: string;
    memberIds: string[];
    members: Record<string, GroupMember>;
    groupTotal: number;
    monthTotal: Record<string, number>;
    modifiedAt?: Timestamp;
    categories: Category[];
}

export interface GroupInfo extends Group {
    currentMember: GroupMember;
    isCurrentMemberIsAdmin: boolean;
    activeMembers: GroupMember[];
}

export interface GroupMember {
    id: string;
    name: string;
    paid: number;
    share: number;
    role?: MemberRole;
    isVirtual?: boolean;
}

export enum MemberRole {
    admin = "admin",
    user = "user",
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
    return new Date().getTime() > date.getTime();
};

export const getGroupImage = (alt?: string) => {
    if (!alt) {
        return {
            src: "https://img.icons8.com/ios-glyphs/90/image.png",
            alt: "image",
        };
    }

    return GROUP_IMAGES.filter((img) => img.alt === alt)[0];
};

export const GROUP_IMAGES: Image[] = [
    { id: 1, src: "https://img.icons8.com/fluency/96/home.png", alt: "Home" },
    {
        id: 2,
        src: "https://img.icons8.com/fluency/96/sunbathe.png",
        alt: "Vacation",
    },
    {
        id: 3,
        src: "https://img.icons8.com/color/96/person-male.png",
        alt: "Personal",
    },
    {
        id: 4,
        src: "https://img.icons8.com/fluency/96/office.png",
        alt: "Office",
    },
    {
        id: 5,
        src: "https://img.icons8.com/fluency/96/ping-pong.png",
        alt: "Sports",
    },
    {
        id: 6,
        src: "https://img.icons8.com/color-glass/96/rupee.png",
        alt: "Investment",
    },
    { id: 7, src: "https://img.icons8.com/color/96/group.png", alt: "Others" },
    { id: 8, src: "https://img.icons8.com/color/96/car.png", alt: "Vehicle" },
    {
        id: 9,
        src: "https://img.icons8.com/fluency/96/transfer-between-users.png",
        alt: "Exchange",
    },
    { id: 10, src: "https://img.icons8.com/fluency/96/gift.png", alt: "Gifts" },
];
