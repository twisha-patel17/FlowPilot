const Joi = require("joi");

const allowedDays = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const updateScheduleSchema = Joi.object({
  frequency: Joi.string().valid(
    "daily",
    "weekday",
    "weekly",
    "custom"
  ),

  time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .messages({
      "string.pattern.base":
        "Time must be in HH:mm format",
    }),

  timezone: Joi.string()
    .trim()
    .min(1)
    .max(100),

  days: Joi.array()
    .items(
      Joi.string().valid(...allowedDays)
    )
    .min(1)
    .unique()
    .messages({
      "array.min":
        "At least one custom schedule day is required",
      "array.unique":
        "Schedule days must be unique",
    }),
})
  .custom((value, helpers) => {
    const { frequency, days } = value;

    if (
      frequency === "custom" &&
      (!Array.isArray(days) ||
        days.length === 0)
    ) {
      return helpers.error(
        "any.customDaysRequired"
      );
    }

    if (
      frequency &&
      frequency !== "custom" &&
      days !== undefined
    ) {
      return helpers.error(
        "any.daysOnlyForCustom"
      );
    }

    return value;
  })
  .messages({
    "any.customDaysRequired":
      "Custom schedules require at least one day",

    "any.daysOnlyForCustom":
      "Schedule days can only be used with custom frequency",
  })
  .min(1);

module.exports = {
  updateScheduleSchema,
};