import { NavLink, Link } from "react-router-dom";
import {
  FiHome,
  FiZap,
  FiPlay,
  FiClock,
  FiLink,
  FiShare2,
  FiSettings,
  FiChevronDown,
} from "react-icons/fi";

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
        <div className="px-2 pt-3">
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 text-left transition hover:bg-zinc-800"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500 text-[10px] font-bold text-white">
                DS
              </span>

              <span className="text-sm font-medium text-zinc-200">
                DevSpace Team
              </span>
            </div>

            <FiChevronDown className="h-4 w-4 text-zinc-500" />
          </button>
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
    </>
  );
};

export default Sidebar;