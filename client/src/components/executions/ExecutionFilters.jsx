import {
  FiSearch,
  FiCalendar,
  FiChevronDown,
} from "react-icons/fi";

const ExecutionFilters = ({
  search,
  setSearch,
  workflow,
  setWorkflow,
  status,
  setStatus,
  time,
  setTime,
  trigger,
  setTrigger,
  workflows,
}) => {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search..."
          className="h-9 w-full rounded-md border border-zinc-800 bg-[#0d0d0f] pl-9 pr-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 transition focus:border-violet-500/50"
        />
      </div>

      {/* Workflow */}
      <div className="relative">
        <select
          value={workflow}
          onChange={(event) =>
            setWorkflow(event.target.value)
          }
          className="h-9 min-w-[150px] appearance-none rounded-md border border-zinc-800 bg-[#0d0d0f] px-3 pr-8 text-sm text-zinc-400 outline-none transition hover:border-zinc-700 focus:border-violet-500/50"
        >
          <option value="all">
            Workflow: All
          </option>

          {workflows.map((item) => (
            <option
              key={item._id}
              value={item._id}
            >
              {item.name}
            </option>
          ))}
        </select>

        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
      </div>

      {/* Status */}
      <div className="relative">
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          className="h-9 min-w-[130px] appearance-none rounded-md border border-zinc-800 bg-[#0d0d0f] px-3 pr-8 text-sm text-zinc-400 outline-none transition hover:border-zinc-700 focus:border-violet-500/50"
        >
          <option value="all">
            Status: All
          </option>

          <option value="success">
            Success
          </option>

          <option value="failed">
            Failed
          </option>

          <option value="running">
            Running
          </option>

          <option value="pending">
            Pending
          </option>
        </select>

        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
      </div>

      {/* Time */}
      <div className="relative">
        <FiCalendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />

        <select
          value={time}
          onChange={(event) =>
            setTime(event.target.value)
          }
          className="h-9 min-w-[160px] appearance-none rounded-md border border-zinc-800 bg-[#0d0d0f] pl-9 pr-8 text-sm text-zinc-400 outline-none transition hover:border-zinc-700 focus:border-violet-500/50"
        >
          <option value="24h">
            Last 24 hours
          </option>

          <option value="7d">
            Last 7 days
          </option>

          <option value="30d">
            Last 30 days
          </option>

          <option value="all">
            All time
          </option>
        </select>

        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
      </div>

      {/* Trigger */}
      <div className="relative">
        <select
          value={trigger}
          onChange={(event) =>
            setTrigger(event.target.value)
          }
          className="h-9 min-w-[130px] appearance-none rounded-md border border-zinc-800 bg-[#0d0d0f] px-3 pr-8 text-sm text-zinc-400 outline-none transition hover:border-zinc-700 focus:border-violet-500/50"
        >
          <option value="all">
            Trigger: All
          </option>

          <option value="manual">
            Manual
          </option>

          <option value="webhook">
            Webhook
          </option>

          <option value="schedule">
            Schedule
          </option>

          <option value="github">
            GitHub
          </option>

          <option value="http">
            HTTP
          </option>
        </select>

        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
      </div>
    </div>
  );
};

export default ExecutionFilters;