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