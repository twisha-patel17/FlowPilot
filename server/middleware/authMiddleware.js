const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      typeof authHeader !== "string" ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const token =
      authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    if (
      !process.env.ACCESS_TOKEN_SECRET
    ) {
      console.error(
        "ACCESS_TOKEN_SECRET is not configured"
      );

      return res.status(500).json({
        message:
          "Authentication service unavailable",
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env
          .ACCESS_TOKEN_SECRET
      );

    if (
      !decoded ||
      typeof decoded.userId !==
        "string"
    ) {
      return res.status(401).json({
        message:
          "Invalid or expired access token",
      });
    }

    const user =
      await User.findById(
        decoded.userId
      );

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid or expired access token",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    if (
      error.name ===
        "TokenExpiredError" ||
      error.name ===
        "JsonWebTokenError" ||
      error.name ===
        "NotBeforeError"
    ) {
      return res.status(401).json({
        message:
          "Invalid or expired access token",
      });
    }

    console.error(
      "Authentication middleware error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Authentication service unavailable",
    });
  }
};

module.exports = protect;