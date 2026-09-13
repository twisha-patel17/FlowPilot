const Joi = require("joi");

const createWorkspaceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

const updateWorkspaceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

module.exports = {
  createWorkspaceSchema,
  updateWorkspaceSchema,
};