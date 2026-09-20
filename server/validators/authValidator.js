const Joi = require("joi");

const passwordSchema = Joi.string()
  .min(8)
  .max(100)
  .required();

const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),

  password: passwordSchema,

  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),

  // Keep login compatible with existing accounts.
  password: Joi.string()
    .min(1)
    .max(100)
    .required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required(),

  newPassword: passwordSchema,

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
    }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50),

  email: Joi.string()
    .trim()
    .lowercase()
    .email(),
}).min(1);

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
};