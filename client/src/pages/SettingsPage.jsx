import { useEffect, useState } from "react";

import {
  FiAlertTriangle,
  FiLock,
  FiSave,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

import {
  updateProfile,
  changePassword,
  deleteAccount,
} from "../api/authApi";

const SettingsPage = () => {
  const { user, logout } = useAuth();

  const queryClient = useQueryClient();

  // Profile
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // Password
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPasswordForm, setShowPasswordForm] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [deletePassword, setDeletePassword] =
    useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,

    onSuccess: (data) => {
      queryClient.setQueryData(
        ["currentUser"],
        data
      );

      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });

      toast.success(
        data?.message ||
          "Profile updated successfully."
      );
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update profile."
      );
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,

    onSuccess: (data) => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowPasswordForm(false);

      toast.success(
        data?.message ||
          "Password changed successfully."
      );
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to change password."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,

    onSuccess: async (data) => {
      setShowDeleteModal(false);
      setDeletePassword("");

      queryClient.clear();

      toast.success(
        data?.message ||
          "Account deleted successfully."
      );

      await logout();
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to delete account."
      );
    },
  });

  const handleSaveProfile = (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      toast.error("Name cannot be empty.");
      return;
    }

    if (!trimmedEmail) {
      toast.error("Email cannot be empty.");
      return;
    }

    profileMutation.mutate({
      name: trimmedName,
      email: trimmedEmail,
    });
  };

  const handleChangePassword = (event) => {
    event.preventDefault();

    if (!currentPassword) {
      toast.error(
        "Enter your current password."
      );
      return;
    }

    if (newPassword.length < 8) {
      toast.error(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        "New passwords do not match."
      );
      return;
    }

    passwordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  const handleDeleteAccount = (event) => {
    event.preventDefault();

    if (!deletePassword) {
      toast.error(
        "Enter your password to continue."
      );
      return;
    }

    deleteMutation.mutate(deletePassword);
  };

  return (
    <>
      <div className="max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            Settings
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manage your FlowPilot account and
            preferences.
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
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500"
              />

              <p className="mt-2 text-[11px] text-zinc-600">
                Your email is used for account
                authentication.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end border-t border-zinc-800/70 pt-4">
              <button
                type="submit"
                disabled={
                  profileMutation.isPending
                }
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
              </div>

              <button
                type="button"
                onClick={() => {
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
              {/* Current password */}
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Current password
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(
                      event.target.value
                    )
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
                    setNewPassword(
                      event.target.value
                    )
                  }
                  required
                  className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none focus:border-violet-500"
                />

                <p className="mt-2 text-[11px] text-zinc-600">
                  Must be at least 8 characters.
                </p>
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
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  required
                  className="h-10 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 text-xs text-zinc-200 outline-none focus:border-violet-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-zinc-800/70 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
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
                  disabled={
                    passwordMutation.isPending
                  }
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
            Workspaces can be created and switched
            directly from the sidebar.
          </p>
        </section>

        <section className="rounded-xl border border-red-900/40 bg-[#0d0d0f]">
          <div className="flex items-center gap-3 border-b border-red-900/30 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500/10 text-red-400">
              <FiTrash2 className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-medium text-zinc-200">
                Danger zone
              </h2>

              <p className="text-xs text-zinc-600">
                Permanently delete your FlowPilot
                account.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-300">
                Delete account
              </p>

              <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-600">
                This permanently deletes your account
                and owned workspaces. This action
                cannot be undone.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeletePassword("");
                setShowDeleteModal(true);
              }}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-red-900/50 px-4 text-xs font-medium text-red-400 transition hover:border-red-800 hover:bg-red-500/10"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
              Delete account
            </button>
          </div>
        </section>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#111114] shadow-2xl">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-zinc-800/70 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-500/10 text-red-400">
                  <FiAlertTriangle className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Delete account?
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    This action is permanent. Your
                    account and owned workspaces will
                    be deleted.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  deleteMutation.isPending
                }
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                }}
                className="text-zinc-600 transition hover:text-zinc-300 disabled:cursor-not-allowed"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Modal form */}
            <form
              onSubmit={handleDeleteAccount}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Enter your password to confirm
                </label>

                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) =>
                    setDeletePassword(
                      event.target.value
                    )
                  }
                  autoFocus
                  required
                  placeholder="Your current password"
                  className="h-10 w-full rounded-md border border-zinc-800 bg-[#0d0d0f] px-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-800/70 pt-4">
                <button
                  type="button"
                  disabled={
                    deleteMutation.isPending
                  }
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword("");
                  }}
                  className="h-9 rounded-md border border-zinc-800 px-4 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    deleteMutation.isPending
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-4 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />

                  {deleteMutation.isPending
                    ? "Deleting..."
                    : "Delete permanently"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPage;