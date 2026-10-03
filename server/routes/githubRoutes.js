const express = require("express");

const {
  testTrigger,
} = require("../controllers/githubController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post(
  "/test-trigger",
  testTrigger
);

module.exports = router;