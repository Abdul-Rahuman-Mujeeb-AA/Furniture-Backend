const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile);

module.exports = router;
