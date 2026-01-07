// ① Experience Level - ベトナム料理の経験値 (single select)
export const EXPERIENCE_OPTIONS = ["first_time", "not_familiar", "frequent"] as const;
export type ExperienceOption = (typeof EXPERIENCE_OPTIONS)[number];

// ③ Smell Tolerance - 匂い・香りの許容レベル (single select)
export const SMELL_OPTIONS = ["no_smell", "mild_ok", "strong_ok"] as const;
export type SmellOption = (typeof SMELL_OPTIONS)[number];

// ④ Taste Preference - 日本料理に例えると (multi select)
export const TASTE_PREFERENCE_OPTIONS = [
    "udon", "teriyaki", "tempura", "tsukemen", "salad", "takikomi", "curry"
] as const;
export type TastePreferenceOption = (typeof TASTE_PREFERENCE_OPTIONS)[number];

// ⑤ Allergies - アレルギー・苦手な食材 (multi select)
export const ALLERGY_OPTIONS = [
    "none", "seafood", "nuts", "coriander",
    "egg", "dairy", "gluten", "soy", "alcohol"
] as const;
export type AllergyOption = (typeof ALLERGY_OPTIONS)[number];

// Interface for preference data matching backend
export interface PreferenceData {
    target_name?: string;
    experience_level?: ExperienceOption;
    smell_tolerance?: SmellOption;
    taste_preference?: TastePreferenceOption[];
    allergies?: AllergyOption[];
    updated_at?: string;
}