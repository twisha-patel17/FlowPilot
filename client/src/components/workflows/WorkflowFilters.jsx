import { useState } from "react";
import { FiSearch } from "react-icons/fi";

const WorkflowFilters = ({ activeFilter, setActiveFilter }) => {
  const [search, setSearch] = useState("");

  const filters = ["All", "Active", "Inactive"];

  return (
    <div className="flex flex-col gap-3 border-b border-zinc-800/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

        <input
          type="text"
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900/60 pl-9 pr-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/50 p-1">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-violet-500/15 text-violet-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowFilters;