const Joi = require("joi");

const triggerSchema = Joi.object({
  type: Joi.string()
    .valid("manual", "webhook", "schedule", "github", "http")
    .required(),

  config: Joi.object().default({}),
});

const createWorkflowSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),

  description: Joi.string().trim().max(500).allow("").default(""),

  trigger: triggerSchema.default({
    type: "manual",
    config: {},
  }),

  nodes: Joi.array().items(Joi.object()).default([]),

  edges: Joi.array().items(Joi.object()).default([]),
});

const updateWorkflowSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),

  description: Joi.string().trim().max(500).allow(""),

  status: Joi.string().valid("active", "inactive"),

  trigger: triggerSchema,

  nodes: Joi.array().items(Joi.object()),

  edges: Joi.array().items(Joi.object()),
}).min(1);

module.exports = {
  createWorkflowSchema,
  updateWorkflowSchema,
};