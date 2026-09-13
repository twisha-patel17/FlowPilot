const Joi = require("joi");

const createWebhookSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),

  workflowId: Joi.string().trim().required(),

  events: Joi.array()
    .items(Joi.string().trim().min(1))
    .default([]),

  active: Joi.boolean().default(true),
});

const updateWebhookSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),

  events: Joi.array().items(Joi.string().trim().min(1)),

  active: Joi.boolean(),
}).min(1);

module.exports = {
  createWebhookSchema,
  updateWebhookSchema,
};