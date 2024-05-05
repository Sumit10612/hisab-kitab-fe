export interface User {
    uid: string;
    name?: string;
    email?: string;
    photoUrl?: string;
    preferences?: UserPreferences;
    groups?: string[];
}

export interface UserPreferences {
    theme?: string;
}