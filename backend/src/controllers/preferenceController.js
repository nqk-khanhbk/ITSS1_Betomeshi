const preferenceModel = require('../models/preferenceModel');

// Valid values for validation - must match frontend preferences.ts
const VALID_EXPERIENCE_LEVELS = ['first_time', 'not_familiar', 'frequent'];
const VALID_SMELL_TOLERANCES = ['no_smell', 'mild_ok', 'strong_ok'];
const VALID_TASTE_PREFERENCES = [
  'udon', 'teriyaki', 'tempura', 'tsukemen', 'salad', 'takikomi', 'curry'
];
const VALID_ALLERGIES = [
  'none', 'shellfish', 'seafood', 'nuts', 'coriander',
  'egg', 'dairy', 'gluten', 'soy', 'alcohol'
];

/**
 * Validate preference values
 * @param {object} preferences 
 * @returns {object} { valid: boolean, errors: string[] }
 */
const validatePreferences = (preferences) => {
  const errors = [];

  if (preferences.experience_level && !VALID_EXPERIENCE_LEVELS.includes(preferences.experience_level)) {
    errors.push(`Invalid experience_level. Must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}`);
  }

  if (preferences.smell_tolerance && !VALID_SMELL_TOLERANCES.includes(preferences.smell_tolerance)) {
    errors.push(`Invalid smell_tolerance. Must be one of: ${VALID_SMELL_TOLERANCES.join(', ')}`);
  }

  if (preferences.taste_preference && Array.isArray(preferences.taste_preference)) {
    const invalidTastes = preferences.taste_preference.filter(t => !VALID_TASTE_PREFERENCES.includes(t));
    if (invalidTastes.length > 0) {
      errors.push(`Invalid taste_preference values: ${invalidTastes.join(', ')}. Valid options: ${VALID_TASTE_PREFERENCES.join(', ')}`);
    }
  }

  if (preferences.allergies && Array.isArray(preferences.allergies)) {
    const invalidAllergies = preferences.allergies.filter(a => !VALID_ALLERGIES.includes(a));
    if (invalidAllergies.length > 0) {
      errors.push(`Invalid allergies values: ${invalidAllergies.join(', ')}. Valid options: ${VALID_ALLERGIES.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
};

exports.upsertPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = req.body;

    // Basic validation
    if (!preferences) {
      return res.status(400).json({ message: 'No preferences provided' });
    }

    // Validate preference values
    const validation = validatePreferences(preferences);
    if (!validation.valid) {
      return res.status(400).json({ 
        message: 'Invalid preference values', 
        errors: validation.errors 
      });
    }

    const result = await preferenceModel.upsert(userId, preferences);
    res.json(result);
  } catch (error) {
    console.error('Upsert preferences error:', error);
    res.status(500).json({ message: 'Error saving preferences' });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await preferenceModel.getByUserId(userId);
    res.json(result || {});
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Error fetching preferences' });
  }
};

// Export validation constants for external use
exports.VALID_EXPERIENCE_LEVELS = VALID_EXPERIENCE_LEVELS;
exports.VALID_SMELL_TOLERANCES = VALID_SMELL_TOLERANCES;
exports.VALID_TASTE_PREFERENCES = VALID_TASTE_PREFERENCES;
exports.VALID_ALLERGIES = VALID_ALLERGIES;
