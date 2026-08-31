const express = require("express");

const {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

router.get("/me", protect, getMe);

module.exports = router;