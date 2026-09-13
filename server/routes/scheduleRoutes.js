const express = require("express");

const {
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/scheduleController");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const {
  updateScheduleSchema,
} = require("../validators/scheduleValidator");

const router = express.Router();

router.use(protect);

router.get("/", getSchedules);

router.get("/:id", getSchedule);

router.patch(
  "/:id",
  validate(updateScheduleSchema),
  updateSchedule
);

router.delete("/:id", deleteSchedule);

module.exports = router;