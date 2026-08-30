import { FiMenu, FiSearch, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Topbar = ({ setMobileOpen, title = "Overview" }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-[58px] border-b border-zinc-800/70 bg-[#09090b]/95 backdrop-blur-sm md:left-[220px]">
      <div className="flex h-full items-center justify-between px-4 md:px-5">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 md:hidden"
            aria-label="Open navigation"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          <span className="text-sm font-semibold text-zinc-200">
            {title}
          </span>
        </div>

        {/* Search */}
        <div className="hidden w-full max-w-[260px] md:block">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3">
            <FiSearch className="h-4 w-4 text-zinc-600" />

            <input
              type="text"
              placeholder="Search..."
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            />

            <span className="rounded border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600">
              ⌘K
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
        >
          <span className="hidden sm:inline">Log out</span>
          <FiLogOut className="h-4 w-4 sm:hidden" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;