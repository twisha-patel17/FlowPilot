import { useEffect, useState } from "react";

import { FiUser, FiLock, FiSave } from "react-icons/fi";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../context/AuthContext";
import {
  updateProfile,
  changePassword,
} from "../api/authApi";

const SettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPasswordForm, setShowPasswordForm] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");
  const [passwordMessage, setPasswordMessage] =
    useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,

    onSuccess: (data) => {
      setProfileMessage(
        data?.message || "Profile updated successfully."
      );

      queryClient.setQueryData(
        ["currentUser"],
        { user: data.user }
      );

      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
    },

    onError: (error) => {
      setProfileMessage(
        error?.response?.data?.message ||
          "Failed to update profile."
      );
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,

    onSuccess: (data) => {
      setPasswordMessage(
        data?.message ||
          "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowPasswordForm(false);
    },

    onError: (error) => {
      setPasswordMessage(
        error?.response?.data?.message ||
          "Failed to change password."
      );
    },
  });

  const handleSaveProfile = (event) => {
    event.preventDefault();

    setProfileMessage("");

    profileMutation.mutate({
      name,
      email,
    });
  };

  const handleChangePassword = (event) => {
    event.preventDefault();

    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        "New passwords do not match."
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage(
        "New password must be at least 6 characters."
      );
      return;
    }

    passwordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    });
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

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500"
            />

            <p className="mt-2 text-[11px] text-zinc-600">
              Your email is used for account authentication.
            </p>
          </div>

          {profileMessage && (
            <p className="text-xs text-zinc-400">
              {profileMessage}
            </p>
          )}

          <div className="flex justify-end border-t border-zinc-800/70 pt-4">
            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-violet-600 px-4 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSave className="h-3.5 w-3.5" />

              {profileMutation.isPending
                ? "Saving..."
                : "Save changes"}
            </button>
          </div>
        </form>
      </section>

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

        {!showPasswordForm ? (
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm text-zinc-300">
                Password
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Change your account password.
              </p>

              {passwordMessage && (
                <p className="mt-2 text-xs text-zinc-400">
                  {passwordMessage}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setPasswordMessage("");
                setShowPasswordForm(true);
              }}
              className="h-9 rounded-md border border-zinc-800 px-4 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              Change password
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleChangePassword}
            className="space-y-5 p-5"
          >
           
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Current password
              </label>

              <input
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                required
                className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none focus:border-violet-500"
              />
            </div>

            {/* New password */}
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                New password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                required
                className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none focus:border-violet-500"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Confirm new password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
                className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none focus:border-violet-500"
              />
            </div>

            {/* Message */}
            {passwordMessage && (
              <p className="text-xs text-zinc-400">
                {passwordMessage}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-zinc-800/70 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordMessage("");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="h-9 rounded-md border border-zinc-800 px-4 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="h-9 rounded-md bg-violet-600 px-4 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {passwordMutation.isPending
                  ? "Updating..."
                  : "Update password"}
              </button>
            </div>
          </form>
        )}
      </section>

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