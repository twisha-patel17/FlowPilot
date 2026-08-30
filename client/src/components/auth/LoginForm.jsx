import { useState } from "react";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Login data:", formData);
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

      {/* Submit */}
      <button
        type="submit"
        className="h-10 w-full rounded-md bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 active:scale-[0.99]"
      >
        Sign In
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