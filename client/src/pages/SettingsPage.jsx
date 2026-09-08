import { useState } from "react";

import { FiUser, FiLock, FiSave } from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

const SettingsPage = () => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");

  const handleSaveProfile = (event) => {
    event.preventDefault();

    console.log("Profile update:", {
      name,
    });

    alert("Profile settings saved.");
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
          Settings
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Manage your FlowPilot account and preferences.
        </p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f]">
        <div className="flex items-center gap-3 border-b border-zinc-800/70 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/10 text-violet-400">
            <FiUser className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-sm font-medium text-zinc-200">
              Profile
            </h2>

            <p className="text-xs text-zinc-600">
              Update your account information.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSaveProfile}
          className="space-y-5 p-5"
        >
          {/* Name */}
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Email
            </label>

            <input
              type="email"
              value={email}
              disabled
              className="h-10 w-full cursor-not-allowed rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-500 outline-none"
            />

            <p className="mt-2 text-[11px] text-zinc-600">
              Email changes are not available yet.
            </p>
          </div>

          {/* Save */}
          <div className="flex justify-end border-t border-zinc-800/70 pt-4">
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-violet-600 px-4 text-xs font-medium text-white transition hover:bg-violet-500"
            >
              <FiSave className="h-3.5 w-3.5" />
              Save changes
            </button>
          </div>
        </form>
      </section>

      {/* Security */}
      <section className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f]">
        <div className="flex items-center gap-3 border-b border-zinc-800/70 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/10 text-violet-400">
            <FiLock className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-sm font-medium text-zinc-200">
              Security
            </h2>

            <p className="text-xs text-zinc-600">
              Manage your account security.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-zinc-300">
              Password
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Change your account password.
            </p>
          </div>

          <button
            type="button"
            disabled
            className="h-9 rounded-md border border-zinc-800 px-4 text-xs font-medium text-zinc-600"
          >
            Change password
          </button>
        </div>
      </section>

      {/* Workspace note */}
      <section className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] p-5">
        <p className="text-xs font-medium text-zinc-400">
          Workspace management
        </p>

        <p className="mt-1 text-xs leading-5 text-zinc-600">
          Workspaces can be created and switched directly
          from the sidebar.
        </p>
      </section>
    </div>
  );
};

export default SettingsPage;