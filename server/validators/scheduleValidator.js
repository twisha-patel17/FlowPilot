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
    .items(Joi.string().valid(...allowedDays))
    .min(1)
    .unique()
    .messages({
      "array.min":
        "At least one custom schedule day is required",
    }),
})
  .custom((value, helpers) => {
    if (
      value.frequency === "custom" &&
      (!value.days || value.days.length === 0)
    ) {
      return helpers.error(
        "any.customDaysRequired"
      );
    }

    return value;
  })
  .messages({
    "any.customDaysRequired":
      "Custom schedules require at least one day",
  })
  .min(1);

module.exports = {
  updateScheduleSchema,
};