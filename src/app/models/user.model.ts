export interface User {
    uid: string;
    name?: string | null;
    email?: string;
    photoUrl?: string;
    preferences?: UserPreferences;
}

export interface UserPreferences {
    theme?: string;
}