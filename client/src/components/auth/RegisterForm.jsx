import { useState } from "react";
import { Link } from "react-router-dom";

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Register data:", formData);
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
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900/70 px-3 pr-16 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="h-10 w-full rounded-md bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 active:scale-[0.99]"
      >
        Create account
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