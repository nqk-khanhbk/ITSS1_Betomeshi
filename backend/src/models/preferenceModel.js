const db = require('../db');

const preferenceModel = {
  /**
   * Get user preferences by user ID
   * @param {number} userId 
   * @returns {Promise<object|null>}
   */
  getByUserId: async (userId) => {
    const query = 'SELECT * FROM user_preferences WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows || null;
  },

  /**
   * Get user preference by user ID and target name
   * @param {number} userId 
   * @param {string} targetName 
   * @returns {Promise<object|null>}
   */
  getByUserIdAndTarget: async (userId, targetName) => {
    const query = 'SELECT * FROM user_preferences WHERE user_id = $1 AND target_name = $2';
    const result = await db.query(query, [userId, targetName]);
    return result.rows[0] || null;
  },

  /**
   * Create or update user preferences
   * @param {number} userId 
   * @param {object} preferences 
   */
  upsert: async (userId, preferences) => {
    const {
      target_name = '',
      experience_level = '',
      smell_tolerance = '',
      taste_preference = [],
      allergies = []
    } = preferences;

    // Check if exists
    const existing = await preferenceModel.getByUserId(userId);
    const targetPreference = existing.find(item => item.target_name === target_name);

    if (targetPreference) {
      const query = `
        UPDATE user_preferences 
        SET experience_level = $1, 
            smell_tolerance = $2, 
            taste_preference = $3,
            allergies = $4, 
            target_name = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $6 AND target_name = $7
        RETURNING *
      `;
      const result = await db.query(query, [
        experience_level,
        smell_tolerance,
        taste_preference,
        allergies,
        target_name,
        userId,
        target_name
      ]);
      return result.rows[0];
    } else {
      const query = `
        INSERT INTO user_preferences (user_id, target_name, experience_level, smell_tolerance, taste_preference, allergies)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await db.query(query, [
        userId,
        target_name,
        experience_level,
        smell_tolerance,
        taste_preference,
        allergies
      ]);
      return result.rows[0];
    }
  }
};

module.exports = preferenceModel;
