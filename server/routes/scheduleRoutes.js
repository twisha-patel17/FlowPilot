const express = require("express");

const {
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/scheduleController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getSchedules);

router.get("/:id", getSchedule);

router.patch("/:id", updateSchedule);

router.delete("/:id", deleteSchedule);

module.exports = router;