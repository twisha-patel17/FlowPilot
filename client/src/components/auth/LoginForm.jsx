import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const LoginForm = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const {
    login,
    loginLoading,
    loginError,
  } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(formData);

      navigate("/app");
    } catch (error) {
      console.error("Login failed:", error);
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
          required
          className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900/70 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
        />
      </div>

      {/* Password */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-zinc-400"
          >
            Password
          </label>

          <Link
            to="/forgot-password"
            className="text-xs text-zinc-500 transition-colors hover:text-violet-400"
          >
            Forgot password?
          </Link>
        </div>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900/70 px-3 pr-16 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* API Error */}
      {loginError && (
        <div className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2.5">
          <p className="text-center text-xs text-red-400">
            {loginError.response?.data?.message ||
              "Unable to sign in. Please check your credentials."}
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loginLoading}
        className="h-10 w-full rounded-md bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loginLoading ? "Signing in..." : "Sign In"}
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
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
      >
        <span className="text-sm">●</span>

        <span>Continue with GitHub</span>
      </button>

      {/* Register */}
      <p className="pt-1 text-center text-sm text-zinc-500">
        Don't have an account?{" "}

        <Link
          to="/register"
          className="font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          Create one
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;