const Joi = require("joi");

const updateScheduleSchema = Joi.object({
  frequency: Joi.string()
    .valid("daily", "weekday", "weekly"),

  time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .messages({
      "string.pattern.base": "Time must be in HH:mm format",
    }),

  timezone: Joi.string()
    .trim()
    .min(1)
    .max(100),
}).min(1);

module.exports = {
  updateScheduleSchema,
};