const db = require("../db");
/**
 * Fetch a food along with its images and reviews.
 * Keeps queries simple and easy to maintain.
 * @param {number} foodId
 * @returns {Promise<{food: object|null, images: string[], reviews: object[]}>}
 */
async function getPopularFoods(limit = "4", lang = "jp") {
  if (lang == "jp") {
    const result = await db.query(
      `
    SELECT
      f.food_id,
      f.name,
      f.story,
      f.taste,
      f.rating,
      f.number_of_rating,
      ( SELECT image_url
        FROM food_images
        WHERE food_id = f.food_id
        ORDER BY food_image_id ASC
        LIMIT 1
      ) AS image_url
    FROM foods f
    ORDER BY f.rating DESC
    LIMIT $1
  `,
      [limit]
    );
    return result.rows;
  }

  const result = await db.query(
    `
    SELECT 
      f.food_id,
      COALESCE(ft.name, f.name) AS name,
      COALESCE(ft.story, f.story) AS story,
      COALESCE(ft.taste, f.taste) AS taste,
      f.rating,
      f.number_of_rating,
      (
        SELECT image_url
        FROM food_images 
        WHERE food_id = f.food_id
        ORDER BY food_image_id ASC
        LIMIT 1
      ) AS image_url
    FROM foods f
    LEFT JOIN food_translations ft ON ft.food_id = f.food_id AND ft.lang = $1
    ORDER BY f.rating DESC
    LIMIT $2
  `,
    [lang, limit]
  );

  return result.rows;
}

/**
 * Fetch a food along with its images and reviews.
 */

async function findFoodWithRelations(foodId, lang = "jp") {
  if (lang === "jp") {
    // Query foods table
    const foodResult = await db.query(
      `SELECT food_id, name, story, ingredient, taste, style, comparison, region_id, view_count, rating, number_of_rating, created_at
       FROM foods
       WHERE food_id = $1`,
      [foodId]
    );
    if (foodResult.rowCount === 0) {
      return { food: null, images: [], reviews: [] };
    }
    // Query food_images table (matches schema.sql)
    const imagesResult = await db.query(
      `SELECT food_image_id, image_url
        FROM food_images
        WHERE food_id = $1
        ORDER BY display_order, food_image_id`,
      [foodId]
    );
    // Query reviews table (matches schema.sql)
    const reviewsResult = await db.query(
      `SELECT review_id, users.user_id, users.full_name, comment, rating, r.created_at
       FROM reviews r JOIN users ON r.user_id = users.user_id
       WHERE target_id = $1 AND type = 'food'
       ORDER BY review_id DESC`,
      [foodId]
    );
    return {
      food: foodResult.rows[0],
      images: imagesResult.rows, // array of { food_image_id, image_url }
      reviews: reviewsResult.rows,
    };
  }

  // Query foods table with translations if available
  const foodResult = await db.query(
    `SELECT f.food_id,
            COALESCE(ft.name, f.name) AS name,
            COALESCE(ft.story, f.story) AS story,
            COALESCE(ft.ingredient, f.ingredient) AS ingredient,
            COALESCE(ft.taste, f.taste) AS taste,
            COALESCE(ft.style, f.style) AS style,
            COALESCE(ft.comparison, f.comparison) AS comparison,
            f.region_id, f.view_count, f.rating, f.number_of_rating, f.created_at
     FROM foods f
     LEFT JOIN food_translations ft ON ft.food_id = f.food_id AND ft.lang = $1
     WHERE f.food_id = $2`,
    [lang, foodId]
  );

  if (foodResult.rowCount === 0) {
    return { food: null, images: [], reviews: [] };
  }

  // Query food_images table (matches schema.sql)
  const imagesResult = await db.query(
    `SELECT food_image_id, image_url
     FROM food_images
     WHERE food_id = $1
     ORDER BY display_order, food_image_id`,
    [foodId]
  );

  // Query reviews table (matches schema.sql)
  const reviewsResult = await db.query(
    `SELECT review_id, users.user_id, users.full_name, comment, rating, r.created_at
     FROM reviews r JOIN users ON r.user_id = users.user_id
     WHERE target_id = $1 AND type = 'food'
     ORDER BY review_id DESC`,
    [foodId]
  );

  return {
    food: foodResult.rows[0],
    images: imagesResult.rows, // array of { food_image_id, image_url }
    reviews: reviewsResult.rows,
  };
}

async function getFilterOptions() {
  const foodTypes = await db.query(
    "SELECT food_type_id as id, name FROM food_types ORDER BY name"
  );
  const flavors = await db.query(
    "SELECT flavor_id as id, name FROM flavors ORDER BY name"
  );
  const ingredients = await db.query(
    "SELECT ingredient_id as id, name FROM ingredients ORDER BY name LIMIT 8"
  ); // MAX 8 ingredients

  return {
    regions: regions.rows,
    food_types: foodTypes.rows,
    flavors: flavors.rows,
    ingredients: ingredients.rows,
  };
}

/**
 * Fetch all foods with filter
 * @param {Object} filters - { region_ids, flavor_ids, ingredient_ids }
 */
async function getAllFoods(filters = {}) {
  const lang = filters.lang || "jp";

  const params = [];
  let paramIndex = 1;

  let sql;

  if (lang === "jp") {
    sql = `
      SELECT 
        f.food_id,
        f.name,
        f.story,
        f.ingredient,
        f.taste,
        f.style,
        f.comparison,
        f.region_id,
        f.view_count,
        f.rating,
        f.number_of_rating,
        f.created_at,
        (SELECT image_url 
         FROM food_images fi 
         WHERE fi.food_id = f.food_id 
         ORDER BY display_order 
         LIMIT 1) AS image_url
      FROM foods f
      WHERE 1=1
    `;
  } else {
    sql = `
      SELECT 
        f.food_id,
        COALESCE(ft.name, f.name) AS name,
        COALESCE(ft.story, f.story) AS story,
        COALESCE(ft.ingredient, f.ingredient) AS ingredient,
        COALESCE(ft.taste, f.taste) AS taste,
        COALESCE(ft.style, f.style) AS style,
        COALESCE(ft.comparison, f.comparison) AS comparison,
        f.region_id,
        f.view_count,
        f.rating,
        f.number_of_rating,
        f.created_at,
        (SELECT image_url 
         FROM food_images fi 
         WHERE fi.food_id = f.food_id 
         ORDER BY display_order 
         LIMIT 1) AS image_url
      FROM foods f
      LEFT JOIN food_translations ft 
        ON ft.food_id = f.food_id 
       AND ft.lang = $${paramIndex}
      WHERE 1=1
    `;
    params.push(lang);
    paramIndex++;
  }

  if (filters.search) {
    if (lang === "jp") {
      sql += ` AND (f.name ILIKE $${paramIndex})`;
    } else {
      sql += ` AND (f.name ILIKE $${paramIndex} OR ft.name ILIKE $${paramIndex})`;
    }
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.region_ids?.length) {
    sql += ` AND f.region_id = ANY($${paramIndex}::int[])`;
    params.push(filters.region_ids);
    paramIndex++;
  }

  if (filters.flavor_ids?.length) {
    sql += `
      AND EXISTS (
        SELECT 1 FROM food_flavors ff
        WHERE ff.food_id = f.food_id
          AND ff.flavor_id = ANY($${paramIndex}::int[])
      )
    `;
    params.push(filters.flavor_ids);
    paramIndex++;
  }

  if (filters.ingredient_ids?.length) {
    sql += `
      AND EXISTS (
        SELECT 1 FROM food_ingredients fi
        WHERE fi.food_id = f.food_id
          AND fi.ingredient_id = ANY($${paramIndex}::int[])
      )
    `;
    params.push(filters.ingredient_ids);
    paramIndex++;
  }

  if (filters.food_type_ids?.length) {
    sql += `
      AND EXISTS (
        SELECT 1 FROM food_food_types fft
        WHERE fft.food_id = f.food_id
          AND fft.food_type_id = ANY($${paramIndex}::int[])
      )
    `;
    params.push(filters.food_type_ids);
    paramIndex++;
  }

  // Filter by quen_thuoc (experience level) - hierarchical
  // User with level N can see foods with quen_thuoc <= N
  // Values: 1 = first_time (safest), 2 = not_familiar, 3 = frequent (all foods)
  if (filters.quen_thuoc) {
    sql += ` AND (f.quen_thuoc IS NULL OR f.quen_thuoc <= $${paramIndex})`;
    params.push(filters.quen_thuoc);
    paramIndex++;
  }

  // Filter by mui_huong (smell tolerance) - hierarchical
  // User with tolerance N can see foods with mui_huong <= N
  // Values: 1 = no_smell, 2 = mild_ok, 3 = strong_ok (all foods)
  if (filters.mui_huong) {
    sql += ` AND (f.mui_huong IS NULL OR f.mui_huong <= $${paramIndex})`;
    params.push(filters.mui_huong);
    paramIndex++;
  }

  // Filter by mon_tuong_tu (taste preference) - text contains overlap
  // Show foods that have at least one matching style from user preference
  // Values: 1-7 representing Japanese food style similarities stored as text "1,3,5"
  if (filters.mon_tuong_tu?.length) {
    sql += ` AND (f.mon_tuong_tu IS NOT NULL AND (`;
    const orConditions = filters.mon_tuong_tu.map((value, idx) => {
      params.push(`%${value}%`);
      return `f.mon_tuong_tu LIKE $${paramIndex + idx}`;
    });
    sql += orConditions.join(" OR ");
    sql += `))`;
    paramIndex += filters.mon_tuong_tu.length;
  }

  // Filter by chua_nguyen_lieu (allergies) - exclude text contains
  // Exclude foods that contain any allergen the user has
  // Values: 1-8 representing different allergens stored as text "1,4"
  if (filters.chua_nguyen_lieu?.length) {
    sql += ` AND (f.chua_nguyen_lieu IS NULL OR (`;
    const andConditions = filters.chua_nguyen_lieu.map((value, idx) => {
      params.push(`%${value}%`);
      return `f.chua_nguyen_lieu NOT LIKE $${paramIndex + idx}`;
    });
    sql += andConditions.join(" AND ");
    sql += `))`;
    paramIndex += filters.chua_nguyen_lieu.length;
  }

  // Filter by Japanese similar food (search in comparison field)
  if (filters.japanese_similar) {
    if (lang === "jp") {
      sql += ` AND f.comparison ILIKE $${paramIndex}`;
    } else {
      sql += ` AND (f.comparison ILIKE $${paramIndex} OR ft.comparison ILIKE $${paramIndex})`;
    }
    params.push(`%${filters.japanese_similar}%`);
    paramIndex++;
  }

  sql += ` ORDER BY f.created_at DESC`;

  const result = await db.query(sql, params);
  return result.rows;
}

module.exports = {
  findFoodWithRelations,
  getPopularFoods,
  getAllFoods,
  getFilterOptions,
};
