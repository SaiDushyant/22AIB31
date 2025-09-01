const express = require("express");
const db = require("../db");
const router = express.Router();

router.post("/", (req, res) => {
  const { url, validity, shortcode } = req.body;

  if (!url || !validity || !shortcode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + validity * 60000);

  // Function to generate a unique shortcode
  const generateUniqueShortcode = (prefix, callback) => {
    const urlName = prefix + Math.random().toString(36).substring(2, 8);

    const query = "SELECT * FROM urls WHERE shortcode = ?";
    db.query(query, [urlName], (err, results) => {
      if (err) return callback(err);

      if (results.length > 0) {
        // Already exists -> try again
        generateUniqueShortcode(prefix, callback);
      } else {
        // Unique -> return it
        callback(null, urlName);
      }
    });
  };

  generateUniqueShortcode(shortcode, (err, uniqueCode) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Insert into DB
    const insertQuery =
      "INSERT INTO urls (url, validity, shortcode, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)";
    db.query(
      insertQuery,
      [url, validity, uniqueCode, createdAt, expiresAt],
      (err, result) => {
        if (err) {
          console.error("Insert error:", err);
          return res.status(500).json({ error: "Failed to save short URL" });
        }

        res.json({
          shortLink: `http://localhost:5000/${uniqueCode}`,
          expiry: expiresAt.toISOString,
        });
      }
    );
  });
});

module.exports = router;
