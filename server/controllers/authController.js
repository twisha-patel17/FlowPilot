const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Workspace = require("../models/Workspace");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");

const REFRESH_TOKEN_MAX_AGE =
  7 * 24 * 60 * 60 * 1000;

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure:
    process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: REFRESH_TOKEN_MAX_AGE,
});

const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

const register = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message:
          "All fields are required",
      });
    }

    if (
      password !== confirmPassword
    ) {
      return res.status(400).json({
        message:
          "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      })
        .select("_id")
        .lean();

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    const user =
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      });

    try {
      await Workspace.create({
        name: "Personal Space",
        owner: user._id,
        members: [
          {
            user: user._id,
            role: "owner",
          },
        ],
      });
    } catch (workspaceError) {
      // Do not leave an account without
      // its required Personal Space.
      await User.deleteOne({
        _id: user._id,
      });

      throw workspaceError;
    }

    const accessToken =
      generateAccessToken(
        user._id.toString()
      );

    const refreshToken =
      generateRefreshToken(
        user._id.toString()
      );

    user.refreshToken =
      hashToken(
        refreshToken
      );

    await user.save();

    res.cookie(
      "refreshToken",
      refreshToken,
      getRefreshCookieOptions()
    );

    return res.status(201).json({
      message:
        "Account created successfully",

      accessToken,

      user:
        sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (
  req,
  res,
  next
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select(
        "+password +refreshToken"
      );

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const accessToken =
      generateAccessToken(
        user._id.toString()
      );

    const refreshToken =
      generateRefreshToken(
        user._id.toString()
      );

    user.refreshToken =
      hashToken(
        refreshToken
      );

    await user.save();

    res.cookie(
      "refreshToken",
      refreshToken,
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      message:
        "Login successful",

      accessToken,

      user:
        sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (
  req,
  res
) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message:
          "Refresh token required",
      });
    }

    if (
      !process.env
        .REFRESH_TOKEN_SECRET
    ) {
      console.error(
        "REFRESH_TOKEN_SECRET is not configured"
      );

      return res.status(500).json({
        message:
          "Authentication service unavailable",
      });
    }

    const decoded =
      jwt.verify(
        refreshToken,
        process.env
          .REFRESH_TOKEN_SECRET
      );

    if (
      !decoded ||
      typeof decoded.userId !==
        "string"
    ) {
      return res.status(401).json({
        message:
          "Invalid or expired refresh token",
      });
    }

    const hashedToken =
      hashToken(
        refreshToken
      );

    const newRefreshToken =
      generateRefreshToken(
        decoded.userId
      );

    const newAccessToken =
      generateAccessToken(
        decoded.userId
      );

    const newHashedToken =
      hashToken(
        newRefreshToken
      );

    /*
     * Atomic token rotation.
     *
     * The old refresh-token hash must
     * still be present when the update
     * occurs. This prevents two concurrent
     * refresh requests from both rotating
     * the same token successfully.
     */
    const user =
      await User.findOneAndUpdate(
        {
          _id:
            decoded.userId,

          refreshToken:
            hashedToken,
        },
        {
          $set: {
            refreshToken:
              newHashedToken,
          },
        },
        {
          new: true,
        }
      );

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid or expired refresh token",
      });
    }

    res.cookie(
      "refreshToken",
      newRefreshToken,
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      accessToken:
        newAccessToken,
    });
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
          "Invalid or expired refresh token",
      });
    }

    console.error(
      "Refresh token error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Authentication service unavailable",
    });
  }
};

const logout = async (
  req,
  res,
  next
) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken;

    if (refreshToken) {
      const hashedToken =
        hashToken(
          refreshToken
        );

      await User.findOneAndUpdate(
        {
          refreshToken:
            hashedToken,
        },
        {
          $set: {
            refreshToken:
              null,
          },
        }
      );
    }

    res.clearCookie(
      "refreshToken",
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      message:
        "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (
  req,
  res
) => {
  return res.status(200).json({
    user:
      sanitizeUser(
        req.user
      ),
  });
};

const getProfile = async (
  req,
  res,
  next
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    return res.status(200).json({
      user:
        sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      email,
    } = req.body;

    if (
      name === undefined &&
      email === undefined
    ) {
      return res.status(400).json({
        message:
          "At least one field is required",
      });
    }

    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    if (name !== undefined) {
      const trimmedName =
        typeof name === "string"
          ? name.trim()
          : "";

      if (!trimmedName) {
        return res.status(400).json({
          message:
            "Name cannot be empty",
        });
      }

      user.name =
        trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail =
        typeof email === "string"
          ? email.trim().toLowerCase()
          : "";

      if (!normalizedEmail) {
        return res.status(400).json({
          message:
            "Email cannot be empty",
        });
      }

      user.email =
        normalizedEmail;
    }

    try {
      await user.save();
    } catch (error) {
      if (
        error.code === 11000
      ) {
        return res.status(409).json({
          message:
            "An account with this email already exists",
        });
      }

      throw error;
    }

    return res.status(200).json({
      message:
        "Profile updated successfully",

      user:
        sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (
  req,
  res,
  next
) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message:
          "All password fields are required",
      });
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return res.status(400).json({
        message:
          "New passwords do not match",
      });
    }

    if (
      newPassword.length < 8
    ) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters",
      });
    }

    const user =
      await User.findById(
        req.user._id
      ).select(
        "+password +refreshToken"
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message:
          "Password change is not available for this account",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Current password is incorrect",
      });
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        12
      );

    // Revoke all existing refresh
    // sessions after password change.
    user.refreshToken = null;

    await user.save();

    res.clearCookie(
      "refreshToken",
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      message:
        "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  getProfile,
  updateProfile,
  changePassword,
};