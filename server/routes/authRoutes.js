const express = require("express");

const {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} = require("../validators/authValidator");

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logout);

router.get("/me", protect, getMe);

router.get("/profile", protect, getProfile);

router.patch(
  "/profile",
  protect,
  validate(updateProfileSchema),
  updateProfile
);

router.patch(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword
);

module.exports = router;