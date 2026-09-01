import { FiClock } from "react-icons/fi";

import ScheduleStatus from "./ScheduleStatus";

const ScheduleCard = ({
  name,
  schedule,
  nextRun,
  lastRun,
  active,
  onToggle,
  onOpen,
}) => {
  return (
    <div className="rounded-xl border border-zinc-800/70 bg-[#0d0d0f] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Information */}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-100">
            {name}
          </h2>

          <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <FiClock className="h-3.5 w-3.5" />
            {schedule}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
            <span>
              Next run:{" "}
              <strong className="font-medium text-zinc-200">
                {nextRun}
              </strong>
            </span>

            <span>
              Last run:{" "}
              <strong className="font-medium text-zinc-200">
                {lastRun}
              </strong>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <ScheduleStatus active={active} />

          {/* Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label={`${active ? "Disable" : "Enable"} ${name}`}
            onClick={onToggle}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
              active
                ? "bg-violet-500"
                : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                active
                  ? "translate-x-4"
                  : "translate-x-0"
              }`}
            />
          </button>

          {/* Open */}
          <button
            type="button"
            onClick={onOpen}
            className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;