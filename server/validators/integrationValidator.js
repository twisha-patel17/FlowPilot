const Joi = require("joi");

const discordCredentialsSchema = Joi.object({
  webhookUrl: Joi.string()
    .uri({
      scheme: ["http", "https"],
    })
    .required(),
}).unknown(false);

const emailCredentialsSchema = Joi.object({
  apiKey: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .required()
    .messages({
      "any.required":
        "Resend API key is required",

      "string.empty":
        "Resend API key is required",

      "string.min":
        "Resend API key is invalid",
    }),

  from: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      "any.required":
        "Email sender address is required",

      "string.empty":
        "Email sender address is required",

      "string.email":
        "Email sender address must be a valid email address",
    }),
}).unknown(false);

const mongodbCredentialsSchema = Joi.object({
  uri: Joi.string()
    .uri({
      scheme: ["mongodb", "mongodb+srv"],
    })
    .required(),
}).unknown(false);

const githubCredentialsSchema = Joi.object({
  token: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required(),
}).unknown(false);

const httpHeaderKeySchema = Joi.string()
  .trim()
  .min(1)
  .max(200)
  .pattern(
    /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/,
    "valid HTTP header name"
  );

const httpHeaderValueSchema = Joi.string()
  .max(5000)
  .custom((value, helpers) => {
    if (/[\r\n]/.test(value)) {
      return helpers.error("string.invalid");
    }

    return value;
  })
  .messages({
    "string.invalid": "HTTP header values cannot contain CRLF characters",
  });

const httpCredentialsSchema = Joi.object({
  headers: Joi.object()
    .pattern(
      httpHeaderKeySchema,
      httpHeaderValueSchema
    )
    .default({}),
}).unknown(false);

const credentialsByProvider = {
  github: githubCredentialsSchema,
  discord: discordCredentialsSchema,
  email: emailCredentialsSchema,
  mongodb: mongodbCredentialsSchema,
  http: httpCredentialsSchema,
};

const createIntegrationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  provider: Joi.string()
    .valid(
      "github",
      "discord",
      "email",
      "mongodb",
      "http"
    )
    .required(),

  credentials: Joi.object()
    .required(),

  metadata: Joi.object()
    .default({})
    .unknown(true),
});

const updateIntegrationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100),

  credentials: Joi.object(),

  metadata: Joi.object()
    .unknown(true),
}).min(1);

module.exports = {
  createIntegrationSchema,
  updateIntegrationSchema,
  credentialsByProvider,
};