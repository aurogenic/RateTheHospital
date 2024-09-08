import mysql from "mysql2";
import dotenv from "dotenv";

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
      SELECT user_id, name, mobile FROM users WHERE user_id = ?
      `,
    [id]
  );
  return result[0];
}

export async function getuserByMobile(mobile) {
  let [result] = await pool.query(
    `
      SELECT user_id, name, mobile FROM users WHERE mobile = ?
      `,
    [mobile]
  );
  return result[0];
}

export async function checkpassword(user_id, password) {
  let [result] = await pool.query(
    `
      SELECT user_id, name, mobile FROM users WHERE user_id = ? AND password = ?
      `,
    [user_id, password]
  );
  return result[0];
}

export async function login(mobile, password) {
  let [result] = await pool.query(
    `
        SELECT user_id, name, mobile, password FROM users WHERE mobile = ? 
        `,
    [mobile]
  );

  if (!result) {
    return { err: "not registered" };
  }

  let user = result[0];
  if (user.password !== password) {
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

//hospitals
export async function createHospital(
  name, lat, lon, address,  location, hospital_type,  total_beds, facilities, contact_number, email, password
) {
  try {
    const [result] = await pool.query(
      `INSERT INTO hospitals
             (name, lat, lon, address, location, hospital_type,  total_beds, facilities,  contact_number, email, password)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)
            `,
      [
        name,
        lat,  lon, address,
        JSON.stringify(location),
        hospital_type,  total_beds,
        JSON.stringify(facilities),
        contact_number,  email, password,
      ]
    );
    await initializeAveragratings(result.insertId);
    return result.insertId;
  } catch (error) {
    console.error(
      "Error creating hospital\n",
      {
        name, at, lon, address, location, hospital_type, total_beds, facilities,  contact_number, email,password,
      },
      "\n",
      error
    );
    return 0;
  }
}

export async function getHospital(id) {
  let [result] = await pool.query(
    `
      SELECT hospital_id, name, lat, lon, address, location, hospital_type, total_beds, facilities, contact_number, email 
      FROM hospitals WHERE hospital_id = ?
      `,
    [id]
  );
  return result[0];
}

export async function getHospitalByEmail(email) {
    let [result] = await pool.query(
      `
      SELECT hospital_id, name, lat, lon, address, location, hospital_type, total_beds, facilities, contact_number, email
      FROM hospitals WHERE email =?
      `,
      [email]
    );
    return result[0];
}

export async function hospitalLogin(email, password){
    let [result] = await pool.query(
      `
        SELECT hospital_id, name, lat, lon, address, location, hospital_type, total_beds, facilities, contact_number, email
        FROM hospitals WHERE email =? AND password =?
      `,
      [email, password]
    );
    return result[0];
}

export async function updateHospital(
  hospital_id,
  name,
  lat,
  lon,
  address,
  location,
  hospital_type,
  total_beds,
  facilities,
  contact_number,
  email,
  password
) {
  try {
    const result = await pool.query(
      `
            UPDATE hospitals 
            SET name = ?, lat = ?, lon = ?, address = ?, location = ?, hospital_type = ?, total_beds = ?, facilities = ?, contact_number = ?, email = ?, password = ?
            WHERE hospital_id = ?
            `,
      [
        name,
        lat,
        lon,
        address,
        JSON.stringify(location),
        hospital_type,
        total_beds,
        JSON.stringify(facilities),
        contact_number,
        email,
        password,
        hospital_id,
      ]
    );

    return result.affectedRows;
  } catch (error) {
    console.error("Error updating hospital details", error);
    return 0;
  }
}

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

//hospital searching
export async function getNearbyHospitals(lat, lon, distanceLimit) {
  try {
    const [results] = await pool.query(
      `
            SELECT hospital_id, name, lat, lon, address, location, hospital_type, total_beds, facilities, contact_number, email,
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

export async function getHospitalsByLocation(state, district, city) {
  try {
    const [results] = await pool.query(
      `
            SELECT hospital_id, name, lat, lon, address, location, hospital_type, total_beds, facilities, contact_number, email
            FROM hospitals
            WHERE 
            (JSON_UNQUOTE(JSON_EXTRACT(location, '$.state')) = ? OR ? IS NULL)
            AND (JSON_UNQUOTE(JSON_EXTRACT(location, '$.district')) = ? OR ? IS NULL)
            AND (JSON_UNQUOTE(JSON_EXTRACT(location, '$.city')) = ? OR ? IS NULL)
            `,
      [state, state, district, district, city, city]
    );
    return results;
  } catch (error) {
    console.error("Error fetching hospitals by location", error);
    return [];
  }
}

export async function getHospitalsByState(state) {
  try {
    const [results] = await pool.query(
      `
            SELECT hospital_id, name, lat, lon, address, location, hospital_type, total_beds, facilities, contact_number, email
            FROM hospitals
            WHERE 
            (JSON_UNQUOTE(JSON_EXTRACT(location, '$.state')) = ? OR ? IS NULL)`,
      [state, state]
    );
    return results;
  } catch (error) {
    console.error("Error fetching hospitals by location", error);
    return [];
  }
}

export async function getHospitalsByDistrict(district) {
  try {
    const [results] = await pool.query(
      `
            SELECT hospital_id, name, lat, lon, address, location, hospital_type, total_beds, facilities, contact_number, email
            FROM hospitals
            WHERE 
            (JSON_UNQUOTE(JSON_EXTRACT(location, '$.district')) = ? OR ? IS NULL)
            `,
      [district, district]
    );
    return results;
  } catch (error) {
    console.error("Error fetching hospitals by district", error);
    return [];
  }
}

export async function getHospitalsByCity(city) {
  try {
    const [results] = await pool.query(
      `
            SELECT hospital_id, name, lat, lon, address, location, hospital_type, total_beds, facilities, contact_number, email
            FROM hospitals
            WHERE 
            (JSON_UNQUOTE(JSON_EXTRACT(location, '$.city')) = ? OR ? IS NULL)
            `,
      [city, city]
    );
    return results;
  } catch (error) {
    console.error("Error fetching hospitals by city", error);
    return [];
  }
}

export async function searchHospitals(searchTerm) {
  try {
    const searchQuery = `%${searchTerm}%`;
    const [results] = await pool.query(
      `
            SELECT hospital_id, name, lat, lon, address, location, hospital_type, total_beds, facilities, contact_number, email
            FROM hospitals
            WHERE name LIKE ? OR address LIKE ?
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
export async function createReview(
  hospital_id,
  user_id,
  review_content,
  attachments,
  ratings,
  overall_rating
) {
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
    return result.insertId;
  } catch (error) {
    console.error("Error creating review", error);
    return 0;
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
    const result = await pool.query(
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
    return result.affectedRows;
  } catch (error) {
    console.error("Error updating review", error);
    return 0;
  }
}

export async function deleteReview(review_id) {
  try {
    const result = await pool.query(`DELETE FROM reviews WHERE review_id = ?`, [
      review_id,
    ]);
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
            let ratings = review.ratings;

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

export async function initializeAveragratings(hospital_id){
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

// console.log(await createUser("test4", "1231231231", "test123"))
// await deleteHospital(2, 'test123')
// let x = await createHospital('testHospital', 1.23, 2.34, "first cross", {state: "karnataka", district:"belagavi", city:"gokak"}, "genaral", 100,  ['ambulance', '24/7'], "1010101010", "test0@gmail.com", "test123")
// console.log(await getHospital(x))
// let reviewID = await createReview(3, 7, "test content", {},{cleaniness: 4.2, faculty:3.4}, 4 );
// console.log(await getAverageRatings(3));
// await initializeAveragratings(3)
// console.log( await updateHospitalRating(3))
