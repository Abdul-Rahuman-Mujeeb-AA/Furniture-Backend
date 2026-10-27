const express = require("express");
const router = express.Router();

const {
  updateProfile,
  changePassword,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;