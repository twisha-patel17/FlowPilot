import { FiSearch, FiCalendar, FiChevronDown } from "react-icons/fi";

const ExecutionFilters = () => {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

        <input
          type="text"
          placeholder="Search..."
          className="h-9 w-full rounded-md border border-zinc-800 bg-[#0d0d0f] pl-9 pr-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 transition focus:border-violet-500/50"
        />
      </div>

      {/* Workflow */}
      <button
        type="button"
        className="flex h-9 items-center justify-between gap-3 rounded-md border border-zinc-800 bg-[#0d0d0f] px-3 text-sm text-zinc-400 hover:border-zinc-700"
      >
        <span>Workflow: All</span>
        <FiChevronDown className="h-3.5 w-3.5 text-zinc-600" />
      </button>

      {/* Status */}
      <button
        type="button"
        className="flex h-9 items-center justify-between gap-3 rounded-md border border-zinc-800 bg-[#0d0d0f] px-3 text-sm text-zinc-400 hover:border-zinc-700"
      >
        <span>Status: All</span>
        <FiChevronDown className="h-3.5 w-3.5 text-zinc-600" />
      </button>

      {/* Time */}
      <button
        type="button"
        className="flex h-9 items-center gap-2 rounded-md border border-zinc-800 bg-[#0d0d0f] px-3 text-sm text-zinc-400 hover:border-zinc-700"
      >
        <FiCalendar className="h-3.5 w-3.5 text-zinc-600" />
        <span>Last 24 hours</span>
        <FiChevronDown className="h-3.5 w-3.5 text-zinc-600" />
      </button>

      {/* Trigger */}
      <button
        type="button"
        className="flex h-9 items-center justify-between gap-3 rounded-md border border-zinc-800 bg-[#0d0d0f] px-3 text-sm text-zinc-400 hover:border-zinc-700"
      >
        <span>Trigger: All</span>
        <FiChevronDown className="h-3.5 w-3.5 text-zinc-600" />
      </button>
    </div>
  );
};

export default ExecutionFilters;