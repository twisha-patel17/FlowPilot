import { useEffect, useRef, useState } from "react";
import { FiMenu, FiSearch, FiLogOut, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Topbar = ({ setMobileOpen, title = "Overview" }) => {
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // Open search with Ctrl + K / Cmd + K
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        setSearchOpen(true);

        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setSearch("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const searchResults = [
    {
      category: "Navigation",
      name: "Overview",
      path: "/app",
      keywords: "home dashboard overview",
    },
    {
      category: "Navigation",
      name: "Workflows",
      path: "/app/workflows",
      keywords: "workflow automation flows",
    },
    {
      category: "Navigation",
      name: "Executions",
      path: "/app/executions",
      keywords: "executions runs jobs history",
    },
    {
      category: "Navigation",
      name: "Schedules",
      path: "/app/schedules",
      keywords: "schedule scheduled cron",
    },
    {
      category: "Navigation",
      name: "Integrations",
      path: "/app/integrations",
      keywords: "integration github discord email mongodb http",
    },
    {
      category: "Navigation",
      name: "Webhooks",
      path: "/app/webhooks",
      keywords: "webhook trigger endpoint",
    },
    {
      category: "Workspace",
      name: "Settings",
      path: "/app/settings",
      keywords: "settings profile account password",
    },
  ];

  const filteredResults = search.trim()
    ? searchResults.filter((item) => {
        const query = search.toLowerCase();

        return (
          item.name.toLowerCase().includes(query) ||
          item.keywords.toLowerCase().includes(query)
        );
      })
    : searchResults;

  const handleResultClick = (path) => {
    navigate(path);
    setSearch("");
    setSearchOpen(false);
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
        <div
          ref={searchRef}
          className="relative hidden w-full max-w-[300px] md:block"
        >
          <button
            type="button"
            onClick={() => {
              setSearchOpen(true);

              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }}
            className="flex h-9 w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <FiSearch className="h-4 w-4 shrink-0 text-zinc-600" />

            <span className="flex-1 text-sm text-zinc-600">
              Search...
            </span>

            <span className="rounded border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600">
              Ctrl K
            </span>
          </button>

          {/* Search Dropdown */}
          {searchOpen && (
            <div className="absolute left-0 right-0 top-11 overflow-hidden rounded-xl border border-zinc-800 bg-[#111113] shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center gap-2 border-b border-zinc-800 px-3">
                <FiSearch className="h-4 w-4 shrink-0 text-zinc-500" />

                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search FlowPilot..."
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-zinc-600 hover:text-zinc-300"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}

                <kbd className="rounded border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto p-1.5">
                {filteredResults.length > 0 ? (
                  <>
                    {!search && (
                      <p className="px-2.5 pb-2 pt-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                        Quick navigation
                      </p>
                    )}

                    {filteredResults.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() =>
                          handleResultClick(item.path)
                        }
                        className="flex w-full items-center rounded-lg px-2.5 py-2.5 text-left transition hover:bg-zinc-800"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-200">
                            {item.name}
                          </p>

                          <p className="mt-0.5 text-[11px] text-zinc-600">
                            {item.category}
                          </p>
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="px-3 py-8 text-center">
                    <FiSearch className="mx-auto h-5 w-5 text-zinc-700" />

                    <p className="mt-2 text-sm text-zinc-500">
                      No results found
                    </p>

                    <p className="mt-1 text-xs text-zinc-700">
                      Try another search term
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2">
                <span className="text-[10px] text-zinc-600">
                  Navigate to a page
                </span>

                <span className="text-[10px] text-zinc-700">
                  ESC to close
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
        >
          <span className="hidden sm:inline">
            Log out
          </span>

          <FiLogOut className="h-4 w-4 sm:hidden" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;