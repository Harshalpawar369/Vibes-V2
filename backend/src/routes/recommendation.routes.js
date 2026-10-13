const express = require("express");
const { getRecommendations } = require("../controllers/recommendation.controllers");
const { protect } = require("../middlewares/auth.middlewares");

const router = express.Router();


router.get("/", protect, getRecommendations);

module.exports = router;