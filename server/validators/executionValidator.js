const Joi = require("joi");

const createExecutionSchema = Joi.object({
  workflowId: Joi.string().trim().required(),

  input: Joi.object().default({}),
});

module.exports = {
  createExecutionSchema,
};