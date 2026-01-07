import { api } from "./client";
import type { User } from "./auth.api";
import {
    EXPERIENCE_OPTIONS,
    SMELL_OPTIONS,
    TASTE_PREFERENCE_OPTIONS,
    ALLERGY_OPTIONS,
    type ExperienceOption,
    type SmellOption,
    type TastePreferenceOption,
    type AllergyOption,
    type PreferenceData,
} from "@/types/preferences";

interface UpdateProfileData {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    dob: string;
}

interface PreferenceResponse {
    target_name?: string;
    experience_level?: string;
    smell_tolerance?: string;
    taste_preference?: string[] | string;
    allergies?: string[] | string;
    updated_at?: string;
    [key: string]: unknown;
}

function isEnumValue<T extends string>(value: string, allowed: readonly T[]): value is T {
    return allowed.includes(value as T);
}

function parseEnumArray<T extends string>(value: string[] | string | undefined, allowed: readonly T[]): T[] {
    if (!value) {
        return [];
    }

    // Handle if value is already an array
    if (Array.isArray(value)) {
        return value.filter((item): item is T => isEnumValue(item, allowed));
    }

    // Handle if value is a comma-separated string
    return value
        .split(",")
        .map((item) => item.trim())
        .filter((item): item is T => isEnumValue(item, allowed));
}

function parseEnumValue<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
    return value && isEnumValue(value, allowed) ? (value as T) : undefined;
}

export const updateProfile = async (data: UpdateProfileData): Promise<{ message: string; user: User }> => {
    const response = await api.put("/users/profile", data);
    return response.data;
};

export const getPreferences = async (): Promise<PreferenceData[]> => {
    const response = await api.get<PreferenceResponse[]>("/preferences");
    return response.data.map((prefs) => {
        const { experience_level, smell_tolerance, taste_preference, allergies, ...rest } = prefs;

        return {
            ...rest,
            experience_level: parseEnumValue(experience_level, EXPERIENCE_OPTIONS),
            smell_tolerance: parseEnumValue(smell_tolerance, SMELL_OPTIONS),
            taste_preference: parseEnumArray(taste_preference, TASTE_PREFERENCE_OPTIONS),
            allergies: parseEnumArray(allergies, ALLERGY_OPTIONS),
        };
    });
};
