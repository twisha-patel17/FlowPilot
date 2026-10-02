const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Workspace = require("../models/Workspace");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const GITHUB_STATE_MAX_AGE = 10 * 60 * 1000;

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: REFRESH_TOKEN_MAX_AGE,
  path: "/",
});

const getGithubOAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: GITHUB_STATE_MAX_AGE,
  path: "/api/auth/github/callback",
});

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateGithubState = () => crypto.randomBytes(32).toString("hex");

const generateCodeVerifier = () =>
  crypto.randomBytes(32).toString("base64url");

const generateCodeChallenge = (verifier) =>
  crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl || null,
});

const getSafeGithubName = (githubUser) => {
  const name = (githubUser.name || githubUser.login || "GitHub User")
    .trim()
    .slice(0, 50);

  return name.length >= 2 ? name : `GitHub ${name}`.slice(0, 50);
};

const getGithubApiHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "FlowPilot",
});

const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

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

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = hashToken(refreshToken);
    await user.save();

    res.cookie(
      "refreshToken",
      refreshToken,
      getRefreshCookieOptions()
    );

    return res.status(201).json({
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password +refreshToken");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message:
          "This account uses GitHub login. Please continue with GitHub.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = hashToken(refreshToken);
    await user.save();

    res.cookie(
      "refreshToken",
      refreshToken,
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

const githubLogin = async (req, res) => {
  try {
    if (
      !process.env.GITHUB_CLIENT_ID ||
      !process.env.GITHUB_CALLBACK_URL
    ) {
      return res.status(500).json({
        message: "GitHub OAuth is not configured",
      });
    }

    const state = generateGithubState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    res.cookie(
      "githubOAuthState",
      state,
      getGithubOAuthCookieOptions()
    );

    res.cookie(
      "githubOAuthVerifier",
      codeVerifier,
      getGithubOAuthCookieOptions()
    );

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
      scope: "read:user user:email",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return res.redirect(
      `https://github.com/login/oauth/authorize?${params.toString()}`
    );
  } catch (error) {
    console.error("GitHub login error:", error);

    return res.status(500).json({
      message: "Unable to start GitHub login",
    });
  }
};

const githubCallback = async (req, res) => {
  const frontendUrl = process.env.CLIENT_URL;

  const redirectError = () => {
    return res.redirect(`${frontendUrl}/login?github=error`);
  };

  try {
    const { code, state } = req.query;

    const storedState = req.cookies.githubOAuthState;
    const codeVerifier = req.cookies.githubOAuthVerifier;

    res.clearCookie(
      "githubOAuthState",
      getGithubOAuthCookieOptions()
    );

    res.clearCookie(
      "githubOAuthVerifier",
      getGithubOAuthCookieOptions()
    );

    if (req.query.error) {
      return redirectError();
    }

    if (!code || !state || !storedState || !codeVerifier) {
      console.error("GitHub OAuth: missing code/state/verifier");
      return redirectError();
    }

    const stateBuffer = Buffer.from(state);
    const storedStateBuffer = Buffer.from(storedState);

    if (
      stateBuffer.length !== storedStateBuffer.length ||
      !crypto.timingSafeEqual(
        stateBuffer,
        storedStateBuffer
      )
    ) {
      console.error("GitHub OAuth: invalid state");
      return redirectError();
    }

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "FlowPilot",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_CALLBACK_URL,
          code_verifier: codeVerifier,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      console.error(
        "GitHub token exchange failed:",
        tokenData
      );

      return redirectError();
    }

    const githubAccessToken = tokenData.access_token;

    const githubUserResponse = await fetch(
      "https://api.github.com/user",
      {
        headers: getGithubApiHeaders(githubAccessToken),
      }
    );

    if (!githubUserResponse.ok) {
      console.error(
        "GitHub user request failed:",
        await githubUserResponse.text()
      );

      return redirectError();
    }

    const githubUser = await githubUserResponse.json();

    const emailResponse = await fetch(
      "https://api.github.com/user/emails",
      {
        headers: getGithubApiHeaders(githubAccessToken),
      }
    );

    if (!emailResponse.ok) {
      console.error(
        "GitHub email request failed:",
        await emailResponse.text()
      );

      return redirectError();
    }

    const githubEmails = await emailResponse.json();

    const primaryVerifiedEmail = githubEmails.find(
      (email) => email.primary && email.verified
    );

    const verifiedEmail = githubEmails.find(
      (email) => email.verified
    );

    const githubEmail =
      primaryVerifiedEmail?.email ||
      verifiedEmail?.email;

    if (!githubEmail) {
      console.error("GitHub account has no verified email");
      return redirectError();
    }

    const normalizedEmail = githubEmail
      .trim()
      .toLowerCase();

    const githubId = String(githubUser.id);

    let user = await User.findOne({
      githubId,
    }).select("+refreshToken");

    if (!user) {
      user = await User.findOne({
        email: normalizedEmail,
      }).select("+refreshToken");

      if (user) {
        
        if (
          user.githubId &&
          user.githubId !== githubId
        ) {
          console.error(
            "GitHub ID conflict for email:",
            normalizedEmail
          );

          return redirectError();
        }

        user.githubId = githubId;

        if (githubUser.avatar_url) {
          user.avatarUrl = githubUser.avatar_url;
        }

        await user.save();
      }
    }

    if (!user) {
      user = await User.create({
        name: getSafeGithubName(githubUser),
        email: normalizedEmail,
        githubId,
        avatarUrl: githubUser.avatar_url || null,
      });

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
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = hashToken(refreshToken);
    await user.save();

    res.cookie(
      "refreshToken",
      refreshToken,
      getRefreshCookieOptions()
    );

    return res.redirect(
      `${frontendUrl}/auth/github/callback`
    );
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);

    return redirectError();
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token missing",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const hashedToken = hashToken(refreshToken);

    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken: hashedToken,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = hashToken(newRefreshToken);
    await user.save();

    res.cookie(
      "refreshToken",
      newRefreshToken,
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      accessToken: newAccessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    return res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);

      await User.findOneAndUpdate(
        { refreshToken: hashedToken },
        { refreshToken: null }
      );
    }

    res.clearCookie(
      "refreshToken",
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Logout failed",
    });
  }
};

const getMe = async (req, res) => {
  return res.status(200).json({
    user: sanitizeUser(req.user),
  });
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Failed to get profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Email is already in use",
        });
      }

      user.email = normalizedEmail;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select(
      "+password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message:
          "This account does not have a password. GitHub accounts cannot change password here yet.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    // Invalidate existing refresh token
    user.refreshToken = null;

    await user.save();

    res.clearCookie(
      "refreshToken",
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Failed to change password",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id).select(
      "+password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message:
          "GitHub-only accounts cannot be deleted using password confirmation yet.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Incorrect password",
      });
    }

    await Workspace.deleteMany({
      owner: user._id,
    });

    await Workspace.updateMany(
      { "members.user": user._id },
      {
        $pull: {
          members: {
            user: user._id,
          },
        },
      }
    );

    await User.findByIdAndDelete(user._id);

    res.clearCookie(
      "refreshToken",
      getRefreshCookieOptions()
    );

    return res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);

    return res.status(500).json({
      message: "Failed to delete account",
    });
  }
};

module.exports = {
  register,
  login,
  githubLogin,
  githubCallback,
  refreshAccessToken,
  logout,
  getMe,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};