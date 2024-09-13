import mysql from "mysql2";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = mysql
  .createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  })
  .promise();

export async function createUser(username, mobile, password, verified = 1) {
  try {
    const [result] = await pool.query(
      "INSERT INTO users (username, mobile, password, is_verified) VALUES (?,?,?,?)",
      [username, mobile, password, verified]
    );
    return result.insertId;
  } catch (error) {
    console.error(
      "Error creating user\n",
      { username, mobile, password },
      "\n",
      error
    );
    return 0;
  }
}

//user section
export async function getuser(id) {
  let [result] = await pool.query(
    ` 
      SELECT user_id, username, mobile FROM users WHERE user_id = ?
      `,
    [id]
  );
  return result[0];
}

export async function getUserByMobile(mobile) {
  let [result] = await pool.query(
    `
      SELECT user_id, username, mobile FROM users WHERE mobile = ?
      `,
    [mobile]
  );
  return result[0];
}

export async function checkpassword(user_id, password) {
  let [result] = await pool.query(
    `
      SELECT user_id, username, mobile FROM users WHERE user_id = ? AND password = ?
      `,
    [user_id, password]
  );
  return result[0];
}

export async function login(mobile, password) {
  let [result] = await pool.query(
    `
        SELECT user_id, username, mobile, password FROM users WHERE mobile = ? 
        `,
    [mobile]
  );

  if (!result) {
    return { err: "not registered" };
  }

  let user = result[0];
  if (user && user.password !== password) {
    return { err: "wrong password" };
  }
  return result[0];
}

export async function deleteUser(user_id, password) {
  let [result] = await pool.query(
    `
        DELETE FROM users WHERE user_id = ? AND password = ?
        `,
    [user_id, password]
  );

  let user = await getuser(user_id);
  return user ? false : true;
}

export async function changeUserName(user_id, new_name) {
  try {
    const [result] = await pool.query(
      `
            UPDATE users 
            SET username = ? 
            WHERE user_id = ?
            `,
      [new_name, user_id]
    );
    return result.affectedRows;
  } catch (error) {
    console.error("Error changing name\n", { user_id, new_name }, "\n", error);
    return 0;
  }
}

export async function changePassword(user_id, old_password, new_password) {
  try {
    const [result] = await pool.query(
      `
            SELECT password FROM users WHERE user_id = ? 
            `,
      [user_id]
    );

    if (result.length === 0 || result[0].password !== old_password) {
      return { err: "Incorrect old password" };
    }

    const [updateResult] = await pool.query(
      `
            UPDATE users 
            SET password = ? 
            WHERE user_id = ?
            `,
      [new_password, user_id]
    );
    return updateResult.affectedRows;
  } catch (error) {
    console.error(
      "Error changing password\n",
      { user_id, old_password, new_password },
      "\n",
      error
    );
    return 0;
  }
}

// Creating a new hospital
export async function createHospital(
  name, lat, lon, address, location, hospital_type, description, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email, password
) {
  try {
    const [result] = await pool.query(
      `INSERT INTO hospitals
        (name, lat, lon, address, location, hospital_type, description, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email, password)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?)
      `,
      [
        name,
        lat, lon, address,
        JSON.stringify(location),
        hospital_type, description, total_beds, total_doctors, total_nurses,
        JSON.stringify(facilities), JSON.stringify(specialists),
        contact_number, email, password,
      ]
    );
    await initializeAveragRatings(result.insertId);
    return result.insertId;
  } catch (error) {
    console.error(
      "Error creating hospital\n",
      {
        name, lat, lon, address, location, hospital_type, description, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email, password,
      },
      "\n",
      error
    );
    return 0;
  }
}

// Getting hospital by ID
export async function getHospital(id) {
  let [result] = await pool.query(
    `
      SELECT hospital_id, name, description, lat, lon, address, location, hospital_type, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email 
      FROM hospitals WHERE hospital_id = ?
      `,
    [id]
  );
  return result[0];
}

// Getting hospital by email
export async function getHospitalByEmail(email) {
  let [result] = await pool.query(
    `
      SELECT hospital_id, name, description, lat, lon, address, location, hospital_type, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email
      FROM hospitals WHERE email = ?
    `,
    [email]
  );
  return result[0];
}

// Check if email exists
export async function checkIfEmailExists(email) {
  const [result] = await pool.query(
    `SELECT hospital_id FROM hospitals WHERE email = ?`,
    [email]
  );
  return result.length > 0;
}


// Updating hospital details
export async function updateHospital(
  hospital_id, name, lat, lon, address, location, hospital_type, description, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email, password
) {
  try {
    const result = await pool.query(
      `
        UPDATE hospitals 
        SET name = ?, lat = ?, lon = ?, address = ?, location = ?, hospital_type = ?, description = ?, total_beds = ?, total_doctors = ?, total_nurses = ?, facilities = ?, specialists = ?, contact_number = ?, email = ?, password = ?
        WHERE hospital_id = ?
      `,
      [
        name,
        lat, lon, address,
        JSON.stringify(location),
        hospital_type, description, total_beds, total_doctors, total_nurses,
        JSON.stringify(facilities), JSON.stringify(specialists),
        contact_number, email, password, hospital_id,
      ]
    );

    return result.affectedRows;
  } catch (error) {
    console.error("Error updating hospital details", error);
    return 0;
  }
}

// Deleting hospital by ID and password
export async function deleteHospital(id, password) {
  try {
    let [result] = await pool.query(
      `
        DELETE FROM hospitals WHERE hospital_id = ? AND password = ?
      `,
      [id, password]
    );
    return result.affectedRows;
  } catch (error) {
    console.error(`Error deleting hospital: ${id}`, error);
    return 0;
  }
}

// Getting nearby hospitals based on lat, lon, and distance limit
export async function getNearbyHospitals(lat, lon, distanceLimit) {
  try {
    const [results] = await pool.query(
      `
        SELECT hospital_id, name, description, lat, lon, address, location, hospital_type, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(lat)) * cos(radians(lon) - radians(?)) +
            sin(radians(?)) * sin(radians(lat))
          )
        ) AS distance
        FROM hospitals
        HAVING distance < ?
        ORDER BY distance
        LIMIT 10;
      `,
      [lat, lon, lat, distanceLimit]
    );
    return results;
  } catch (error) {
    console.error("Error fetching nearby hospitals", error);
    return [];
  }
}

// Searching for hospitals based on location: state, district, city
export async function getHospitalsByLocation(state, district, city) {
  try {
    const [results] = await pool.query(
      `
        SELECT hospital_id, name, description, lat, lon, address, location, hospital_type, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email
        FROM hospitals
        WHERE 
        (LOWER(JSON_UNQUOTE(JSON_EXTRACT(location, '$.state'))) = LOWER(?) OR ? IS NULL)
        AND (LOWER(JSON_UNQUOTE(JSON_EXTRACT(location, '$.district'))) = LOWER(?) OR ? IS NULL)
        AND (LOWER(JSON_UNQUOTE(JSON_EXTRACT(location, '$.city'))) = LOWER(?) OR ? IS NULL)
      `,
      [state, state, district, district, city, city]
    );
    return results;
  } catch (error) {
    console.error("Error fetching hospitals by location", error);
    return [];
  }
}

// Searching hospitals by state
export async function getHospitalsByState(state) {
  try {
    const [results] = await pool.query(
      `
        SELECT hospital_id, name, description, lat, lon, address, location, hospital_type, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email
        FROM hospitals
        WHERE 
        (LOWER(JSON_UNQUOTE(JSON_EXTRACT(location, '$.state'))) = LOWER(?) OR ? IS NULL)
      `,
      [state, state]
    );
    return results;
  } catch (error) {
    console.error("Error fetching hospitals by state", error);
    return [];
  }
}

// Searching hospitals by district
export async function getHospitalsByDistrict(district) {
  try {
    const [results] = await pool.query(
      `
        SELECT hospital_id, name, description, lat, lon, address, location, hospital_type, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email
        FROM hospitals
        WHERE 
        (LOWER(JSON_UNQUOTE(JSON_EXTRACT(location, '$.district'))) = LOWER(?) OR ? IS NULL)
      `,
      [district, district]
    );
    return results;
  } catch (error) {
    console.error("Error fetching hospitals by district", error);
    return [];
  }
}

// Searching hospitals by city
export async function getHospitalsByCity(city) {
  try {
    const [results] = await pool.query(
      `
        SELECT hospital_id, name, description, lat, lon, address, location, hospital_type, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email
        FROM hospitals
        WHERE 
        (LOWER(JSON_UNQUOTE(JSON_EXTRACT(location, '$.city'))) = LOWER(?) OR ? IS NULL)
      `,
      [city, city]
    );
    return results;
  } catch (error) {
    console.error("Error fetching hospitals by city", error);
    return [];
  }
}

// Searching hospitals by name or address
export async function searchHospitals(searchTerm) {
  try {
    const searchQuery = `%${searchTerm.toLowerCase()}%`;
    const [results] = await pool.query(
      `
        SELECT hospital_id, name, description, lat, lon, address, location, hospital_type, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email
        FROM hospitals
        WHERE LOWER(name) LIKE ? OR LOWER(address) LIKE ?
      `,
      [searchQuery, searchQuery]
    );
    return results;
  } catch (error) {
    console.error("Error searching hospitals by name or address", error);
    return [];
  }
}


//reviews
export async function createReview( hospital_id, user_id,  review_content, attachments,  ratings, overall_rating ) {
  try {
    const [result] = await pool.query(
      `INSERT INTO reviews 
             (hospital_id, user_id, review_content, attachments, ratings, overall_rating) 
             VALUES (?, ?, ?, ?, ?, ?)`,
      [
        hospital_id,
        user_id,
        review_content,
        JSON.stringify(attachments),
        JSON.stringify(ratings),
        overall_rating,
      ]
    );
    await updateHospitalRating( hospital_id);
    return result.insertId;
  } catch (error) {
    console.error("Error creating review", error);
    return 0;
  }
}

export async function getReview(review_id) {
  try {
    const [rows] = await pool.query(
      `SELECT 
          r.review_id,
          r.hospital_id,
          r.user_id,
          r.review_content,
          r.attachments,
          r.ratings,
          r.overall_rating,
          r.timestamp,
          u.username AS user_name,
          h.name AS hospital_name
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        JOIN hospitals h ON r.hospital_id = h.hospital_id
        WHERE r.review_id = ?`,
      [review_id]
    );

    if (rows.length > 0) {
      return rows[0]; // Return the first (and only) review object
    } else {
      return null; // If no review is found
    }
  } catch (error) {
    console.error("Error retrieving review", error);
    return null;
  }
}


export async function updateReview(
  review_id,
  review_content,
  attachments,
  ratings,
  overall_rating
) {
  try {
    const [result] = await pool.query(
      `UPDATE reviews 
       SET review_content = ?, attachments = ?, ratings = ?, overall_rating = ?, timestamp = NOW() 
       WHERE review_id = ?`,
      [
        review_content,
        JSON.stringify(attachments),
        JSON.stringify(ratings),
        overall_rating,
        review_id,
      ]
    );
    await updateHospitalRating( hospital_id);
    return result.affectedRows;
  } catch (error) {
    console.error("Error updating review", error);
    return 0;
  }
}



export async function deleteReview(review_id) {
  try {
    const [reviewRows] = await pool.query(`SELECT attachments, hospital_id FROM reviews WHERE review_id = ?`, [review_id]);

    if (reviewRows.length === 0) {
      console.error("Review not found");
      return 0;
    }

    const review = reviewRows[0];
    const attachments = review.attachments;
    const hospital_id = review.hospital_id;

    if (attachments && attachments.length > 0) {
      attachments.forEach(filePath => {
        const fullFilePath = path.join( 'uploads', filePath); // Assuming the files are stored in 'uploads' directory
        fs.unlink(fullFilePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${fullFilePath}`, err);
          } else {
            console.log(`Successfully deleted file: ${fullFilePath}`);
          }
        });
      });
    }

    const [result] = await pool.query(`DELETE FROM reviews WHERE review_id = ?`, [review_id]);

    await updateHospitalRating(hospital_id);

    return result.affectedRows;
  } catch (error) {
    console.error("Error deleting review", error);
    return 0;
  }
}

export async function getAverageRatings(hospital_id) {
    try {
        const [reviews] = await pool.query(
            `
            SELECT ratings, overall_rating
            FROM reviews 
            WHERE hospital_id = ?
            `,
            [hospital_id]
        );
        
        let categorySums = {};
        let categoryCounts = {};
        let overallRatingSum = 0;

        for (let review of reviews) {
            overallRatingSum += review.overall_rating;
            let ratings = JSON.parse(review.ratings);

            for (let category in ratings) {
                let rating = ratings[category];

                if (rating === -1) continue;

                if (!categorySums[category]) {
                    categorySums[category] = 0;
                    categoryCounts[category] = 0;
                }
                categorySums[category] += rating;
                categoryCounts[category] += 1;
            }
        }
        if (reviews.length <= 0){
           return {averageRatings: {}, overallRating: 0};
        }
        let overallRating = overallRatingSum / reviews.length
        let averageRatings = {};
        for (let category in categorySums) {
            averageRatings[category] = categorySums[category] / categoryCounts[category];
        }

        return {averageRatings, overallRating};

    } catch (error) {
        console.error("Error fetching category-wise average ratings", error);
        return {};
    }
}

export async function initializeAveragRatings(hospital_id){
    const averageRatings = {};
    const overallRating = 3.5;
    try{
        const [results] =await  pool.query(
            `
            INSERT INTO average_ratings 
            (hospital_id, ratings, overall_avg)
            VALUES (?,?,?)
            `, [
                hospital_id,
                JSON.stringify(averageRatings),
                overallRating
            ]
        )
        return results.affectedRows;
    } catch (err){
        console.log("error inititializing hospital ratings", err)
        return 0;
    }

}

export async function setHospitalRating(hospital_id,  averageRatings, overallRating){
    try{
        const [results] = await pool.query(
            `
            UPDATE average_ratings 
            SET
            ratings = ?,
            overall_avg = ?,
            last_updated = NOW()
            WHERE hospital_id = ?
            `, [
                JSON.stringify(averageRatings),
                overallRating,
                hospital_id
            ]
        )
        return results.affectedRows;
    } catch (err){
        console.log("error updating hospital ratings", err)
        return 0;
    }

}

export async function getHospitalRating(hospital_id){
  try{
        const [rows] = await pool.query(
            `
            SELECT ratings, overall_avg
            FROM average_ratings 
            WHERE hospital_id = ?
            `,
            [hospital_id]
        )
        if (rows.length > 0){
            return rows[0];
        } else {
            await initializeAveragRatings(hospital_id);
            return await getHospitalRating(hospital_id);
        }
    } catch (err){
        console.log("error fetching hospital ratings", err)
        return null;
    }
}

export async function updateHospitalRating(hospital_id){
    try{
        const {averageRatings, overallRating} = await getAverageRatings(hospital_id);
        await setHospitalRating(hospital_id, averageRatings, overallRating);
        return 1;
    } catch (err){
        console.log("error updating hospital ratings", err)
        return 0;
    }
}

export async function getRatingCategories(hospital_id) {
  try {
    const [rows] = await pool.query(
      'SELECT JSON_KEYS(ratings) AS rating_categories FROM average_ratings WHERE hospital_id = ?',
      [hospital_id]
    );

    if (rows.length > 0) {
      return rows[0].rating_categories;
    } else {
      return null;
    }
  } catch (err) {
    console.error('Error fetching rating categories:', err);
    throw err;
  }
};


//fetch reviews
export async function getUserReviews(user_id, page = 1) {
  try {
    const limit = 10;
    const offset = (page - 1) * limit;
    const [results] = await pool.query(
      `
      SELECT r.review_id, r.hospital_id, r.review_content, r.attachments, r.ratings, r.overall_rating, r.timestamp, h.name as hospital_name
      FROM reviews r
      JOIN hospitals h ON r.hospital_id = h.hospital_id
      WHERE r.user_id = ?
      ORDER BY r.timestamp DESC
      LIMIT ? OFFSET ?
      `,
      [user_id, limit, offset]
    );

    return results;
  } catch (error) {
    console.error("Error fetching user reviews", error);
    return [];
  }
}

export async function hospitalLogin(email, passwrod){
  try{
    const [rows] = await pool.query(
      `
      SELECT hospital_id, name
      FROM hospitals
      WHERE email = ? AND password = ?
      `,
      [email, passwrod]
    )
    if (rows.length > 0){
      return rows[0];
    } else {
      return null;
    }
  } catch (err){
    console.log("error fetching hospital login", err)
    return null;
  }
}

// console.log(await createUser("test4", "1231231231", "test123"))
// await deleteHospital(2, 'test123')
// let x = await createHospital('testHospital', 1.23, 2.34, "first cross", {state: "karnataka", district:"belagavi", city:"gokak"}, "genaral", 100,  ['ambulance', '24/7'], "1010101010", "test0@gmail.com", "test123")
// console.log(await getHospital(3))
// let reviewID = await createReview(3, 7, "test content", {},{cleaniness: 4.2, faculty:3.4}, 4 );
// console.log(await getAverageRatings(3));
// await initializeAveragRatings(3)
// console.log( await updateHospitalRating(6))
// console.log(await getRatingCategories(3))
// console.log(await getUserReviews(7))
// console.log(await getReview(3))
// console.log(await deleteReview(1))