import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const RegisterForm = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [validationError, setValidationError] =
    useState("");

  const {
    register,
    registerLoading,
    registerError,
  } = useAuth();

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setValidationError("");
  };

  const handleGithubRegister = () => {
    window.location.assign(
      `${import.meta.env.VITE_API_URL}/auth/github`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setValidationError("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword =
      formData.confirmPassword;

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setValidationError(
        "All fields are required."
      );
      return;
    }

    if (name.length < 2) {
      setValidationError(
        "Name must be at least 2 characters."
      );
      return;
    }

    if (!emailRegex.test(email)) {
      setValidationError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!passwordRegex.test(password)) {
      setValidationError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and #."
      );
      return;
    }

    if (password !== confirmPassword) {
      setValidationError(
        "Passwords do not match."
      );
      return;
    }

    try {
      await register({
        name,
        email,
        password,
        confirmPassword,
      });

      navigate("/app");
    } catch (error) {
      console.error(
        "Registration failed:",
        error
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-5"
    >
      {/* Back to Landing */}
      <div className="mb-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <span aria-hidden="true">←</span>
          Back to FlowPilot
        </Link>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs font-medium text-zinc-400"
        >
          Name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          placeholder="Twisha Patel"
          value={formData.name}
          onChange={handleChange}
          autoComplete="name"
          required
          className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900/70 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-medium text-zinc-400"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
          className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900/70 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-xs font-medium text-zinc-400"
        >
          Password
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="••••••••••••"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
            className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900/70 px-3 pr-16 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (prev) => !prev
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
          >
            {showPassword
              ? "Hide"
              : "Show"}
          </button>
        </div>

        <p className="mt-2 text-[11px] leading-4 text-zinc-600">
          8+ characters with uppercase,
          lowercase, number and #.
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-xs font-medium text-zinc-400"
        >
          Confirm password
        </label>

        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={
              showConfirmPassword
                ? "text"
                : "password"
            }
            placeholder="••••••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
            className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900/70 px-3 pr-16 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(
                (prev) => !prev
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
          >
            {showConfirmPassword
              ? "Hide"
              : "Show"}
          </button>
        </div>
      </div>

      {/* Frontend Validation Error */}
      {validationError && (
        <div className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2.5">
          <p className="text-center text-xs leading-5 text-red-400">
            {validationError}
          </p>
        </div>
      )}

      {/* Backend Error */}
      {registerError && !validationError && (
        <div className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2.5">
          <p className="text-center text-xs leading-5 text-red-400">
            {registerError.response?.data?.message ||
              registerError.message ||
              "Unable to create your account. Please try again."}
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={registerLoading}
        className="h-10 w-full rounded-md bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {registerLoading
          ? "Creating account..."
          : "Create account"}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />

        <span className="shrink-0 text-xs text-zinc-600">
          OR
        </span>

        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      {/* GitHub */}
      <button
        type="button"
        onClick={handleGithubRegister}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-current"
          aria-hidden="true"
        >
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.014-1.7-2.782.604-3.369-1.34-3.369-1.34-.455-1.156-1.11-1.464-1.11-1.464-.908-.621.069-.608.069-.608 1.004.071 1.532 1.03 1.532 1.03.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.682-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.202 2.394.1 2.647.64.698 1.028 1.591 1.028 2.682 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.578.688.48A10.001 10.001 0 0 0 22 12C22 6.477 17.523 2 12 2Z" />
        </svg>

        <span>Continue with GitHub</span>
      </button>

      {/* Login Link */}
      <p className="pt-1 text-center text-sm text-zinc-500">
        Already have an account?{" "}

        <Link
          to="/login"
          className="font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;