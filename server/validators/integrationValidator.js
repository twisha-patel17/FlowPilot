const Joi = require("joi");

const createIntegrationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),

  provider: Joi.string()
    .valid("github", "discord", "email", "mongodb", "http")
    .required(),

  credentials: Joi.object().default({}),

  metadata: Joi.object().default({}),
});

const updateIntegrationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),

  credentials: Joi.object(),

  metadata: Joi.object(),
}).min(1);

module.exports = {
  createIntegrationSchema,
  updateIntegrationSchema,
};