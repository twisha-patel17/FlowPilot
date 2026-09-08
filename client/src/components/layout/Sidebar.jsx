import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  FiHome,
  FiZap,
  FiPlay,
  FiClock,
  FiLink,
  FiShare2,
  FiSettings,
  FiChevronDown,
  FiPlus,
} from "react-icons/fi";

import { useWorkspace } from "../../context/WorkspaceContext";
import { createWorkspace } from "../../api/workspaceApi";
import CreateWorkspaceModal from "../workspace/CreateWorkspaceModal";

const navigation = [
  {
    name: "Overview",
    path: "/app",
    icon: FiHome,
  },
  {
    name: "Workflows",
    path: "/app/workflows",
    icon: FiZap,
    badge: 12,
  },
  {
    name: "Executions",
    path: "/app/executions",
    icon: FiPlay,
  },
  {
    name: "Schedules",
    path: "/app/schedules",
    icon: FiClock,
  },
  {
    name: "Integrations",
    path: "/app/integrations",
    icon: FiLink,
  },
  {
    name: "Webhooks",
    path: "/app/webhooks",
    icon: FiShare2,
  },
];

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] =
    useState(false);

  const queryClient = useQueryClient();

  const {
    workspaces,
    currentWorkspace,
    switchWorkspace,
    loading: workspaceLoading,
  } = useWorkspace();

  const createWorkspaceMutation = useMutation({
    mutationFn: createWorkspace,

    onSuccess: (data) => {
      queryClient.setQueryData(["workspaces"], (oldData) => ({
        workspaces: [
          ...(oldData?.workspaces || []),
          data.workspace,
        ],
      }));

      switchWorkspace(data.workspace);

      setCreateWorkspaceOpen(false);
      setWorkspaceOpen(false);
    },
  });

  const handleCreateWorkspace = async (name) => {
    try {
      await createWorkspaceMutation.mutateAsync({ name });
    } catch (error) {
      console.error("Create workspace error:", error);
    }
  };

  const workspaceInitials = currentWorkspace?.name
    ? currentWorkspace.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "WS";

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[220px]
          flex-col border-r border-zinc-800/70
          bg-[#0d0d0f]
          transition-transform duration-200
          md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-[58px] items-center border-b border-zinc-800/70 px-4">
          <Link
            to="/app"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2"
          >
            <img
              src="/src/assets/flowpilot-icon-512.png"
              alt="FlowPilot"
              className="h-6 w-6 rounded-md"
            />

            <span className="text-[15px] font-semibold tracking-tight text-zinc-100">
              FlowPilot
            </span>
          </Link>
        </div>

        {/* Workspace */}
        <div className="relative px-2 pt-3">
          <button
            type="button"
            onClick={() => setWorkspaceOpen((prev) => !prev)}
            className="flex h-10 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 text-left transition hover:bg-zinc-800"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500 text-[10px] font-bold text-white">
                {workspaceLoading ? "..." : workspaceInitials}
              </span>

              <span className="truncate text-sm font-medium text-zinc-200">
                {workspaceLoading
                  ? "Loading..."
                  : currentWorkspace?.name || "No workspace"}
              </span>
            </div>

            <FiChevronDown
              className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
                workspaceOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Workspace dropdown */}
          {workspaceOpen && (
            <div className="absolute left-2 right-2 top-[58px] z-50 overflow-hidden rounded-lg border border-zinc-800 bg-[#111113] shadow-xl">
              {/* Dropdown header */}
              <div className="border-b border-zinc-800/70 px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  Workspaces
                </p>
              </div>

              {/* Workspace list */}
              <div className="max-h-52 overflow-y-auto p-1">
                {workspaces.length === 0 && !workspaceLoading ? (
                  <div className="px-3 py-3">
                    <p className="text-xs text-zinc-500">
                      No workspaces found.
                    </p>
                  </div>
                ) : (
                  workspaces.map((workspace) => {
                    const initials = workspace.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    const isActive =
                      currentWorkspace?._id === workspace._id;

                    return (
                      <button
                        key={workspace._id}
                        type="button"
                        onClick={() => {
                          switchWorkspace(workspace);
                          setWorkspaceOpen(false);
                        }}
                        className={`
                          flex w-full items-center gap-2 rounded-md
                          px-2.5 py-2 text-left transition
                          ${
                            isActive
                              ? "bg-violet-500/10"
                              : "hover:bg-zinc-800"
                          }
                        `}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/20 text-[10px] font-bold text-violet-300">
                          {initials}
                        </span>

                        <span className="truncate text-xs font-medium text-zinc-300">
                          {workspace.name}
                        </span>

                        {isActive && (
                          <span className="ml-auto text-xs text-violet-400">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Create workspace */}
              <button
                type="button"
                onClick={() => {
                  setCreateWorkspaceOpen(true);
                  setWorkspaceOpen(false);
                }}
                className="flex w-full items-center gap-2 border-t border-zinc-800/70 px-3 py-2.5 text-xs text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                <FiPlus className="h-3.5 w-3.5" />
                Create workspace
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-3 flex-1 px-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === "/app"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `
                    flex h-9 items-center gap-3 rounded-md px-3
                    text-sm transition-colors
                    ${
                      isActive
                        ? "bg-violet-500/15 text-zinc-100"
                        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                    }
                    `
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />

                  <span className="flex-1">{item.name}</span>

                  {item.badge && (
                    <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Workspace section */}
          <div className="mt-6">
            <p className="px-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              Workspace
            </p>

            <NavLink
              to="/app/settings"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `
                mt-2 flex h-9 items-center gap-3 rounded-md px-3
                text-sm transition-colors
                ${
                  isActive
                    ? "bg-violet-500/15 text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                }
                `
              }
            >
              <FiSettings className="h-4 w-4" />
              Settings
            </NavLink>
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-zinc-800/70 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-xs font-semibold text-white">
              TP
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">
                Twisha Patel
              </p>

              <p className="truncate text-xs text-zinc-600">
                twisha@devmail.io
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
        onCreate={handleCreateWorkspace}
        loading={createWorkspaceMutation.isPending}
      />
    </>
  );
};

export default Sidebar;