const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } =
      schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map(
          (detail) => ({
            field:
              detail.path.length > 0
                ? detail.path.join(".")
                : "body",
            message:
              detail.message,
          })
        ),
      });
    }

    req.body = value;

    return next();
  };
};

module.exports = validate;