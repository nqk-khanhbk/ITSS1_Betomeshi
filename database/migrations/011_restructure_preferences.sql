-- ====================================
-- Migration: Restructure user_preferences for new Japanese-friendly survey form
-- ====================================

-- Drop old columns that are no longer needed
ALTER TABLE user_preferences DROP COLUMN IF EXISTS favorite_taste;
ALTER TABLE user_preferences DROP COLUMN IF EXISTS disliked_ingredients;
ALTER TABLE user_preferences DROP COLUMN IF EXISTS dietary_criteria;
ALTER TABLE user_preferences DROP COLUMN IF EXISTS priorities;
ALTER TABLE user_preferences DROP COLUMN IF EXISTS private_room;
ALTER TABLE user_preferences DROP COLUMN IF EXISTS group_size;

-- Add new survey columns

-- ① Experience level with Vietnamese cuisine (Mức độ quen thuộc với món Việt)
-- Values: 'first_time', 'not_familiar', 'frequent'
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50);

-- ③ Smell/aroma tolerance level (Mức độ chấp nhận mùi hương)
-- Values: 'none', 'some', 'strong'
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS smell_tolerance VARCHAR(50);

-- ④ Taste preference compared to Japanese dishes (Vị ưa thích so với món Nhật)
-- Values array: 'udon_style', 'teriyaki_style', 'tempura_style', 'tsukemen_style', 
--               'salad_style', 'takikomi_style', 'curry_style'
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS taste_preference TEXT[];

-- ⑤ Allergies and avoided ingredients (Dị ứng & Nguyên liệu cần tránh)
-- Values array: 'none', 'shellfish', 'seafood_all', 'peanuts_nuts', 'coriander',
--               'eggs', 'dairy', 'wheat_gluten', 'soy', 'alcohol'
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS allergies TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.experience_level IS 'Vietnamese cuisine familiarity: first_time, not_familiar, frequent';
COMMENT ON COLUMN user_preferences.smell_tolerance IS 'Aroma acceptance level: none, some, strong';
COMMENT ON COLUMN user_preferences.taste_preference IS 'Array of taste preferences compared to Japanese dishes';
COMMENT ON COLUMN user_preferences.allergies IS 'Array of allergies and ingredients to avoid';
